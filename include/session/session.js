
global.getSession = function (request, output) {
    
    var sessionID = SessionHandler.getSessionIdFromCookie(request);
    if(sessionID){
    	
    	var clientID = getClientID(request);
    	var criteria = {
			object_type: 'session', 
			ip: request.connection.remoteAddress, 
			client_id: clientID, 
			uid: sessionID
		};
        getDBObjectsWithValues(criteria, function(data){
            if(data.length == 0) {
                createSession(request, output);
                return;
            }
            output(data[0]);
        });
    }
    else
    {
        createSession(request, output);
    }
    
    deleteMatchingDBObjects({object_type: 'session', timeout: {$lte: new Date()}}, function(data){});
};

createSession = function(request, output)
{
    var clientID = getClientID(request);
    var sessionTimeout = new Date();
    sessionTimeout.setTime(sessionTimeout.getTime() + (24 * 60 * 60 * 1000));
    
    uniqueID(function(unique)
    {
        createDBObject({object_type: 'session', ip: request.connection.remoteAddress, client_id: clientID, uid: unique, timeout: sessionTimeout}, function(data)
        {
            output(data);
        });
    });
};

global.editSession = function(request, session, unsets, output)
{
    getDBObjectsWithValues({object_type: 'session', uid: session.uid}, function(data)
    {
        if(data.length == 0)
        {
            createSession(request, output);
            return;
        }
        
        editDBObject(data[0]._id, session, unsets, function(data)
        {
            output(data[0]);
        });
    });
    
    deleteMatchingDBObjects({object_type: 'session', timeout: {$lte: new Date()}}, function(data){});
};

global.closeSession = function(session, output)
{
    deleteDBObject(session._id, 'session', output);
};

global.getClientID = function(request)
{
    var whirlpool = require('crypto').createHash('whirlpool');
    whirlpool.update(request.connection.remoteAddress + request.headers['user-agent']);
    var clientID = whirlpool.digest('hex');
    
    return clientID;
};

global.getSessionCookie = function(session)
{
    return {session_id: session.uid, path: '/', expires: '0'};
};

global.getEmptySessionCookie = function()
{
    var expireDate = new Date();
    
    return {session_id: '', path: '/', expires: expireDate.toUTCString()};
};

//types
var SessionStore = null;

/**
 * SessionHandler - Responsible for managing user sessions
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2014, All Rights Reserved
 */
function SessionHandler(){
	
	//ensure a session store was started
	SessionStore = SessionHandler.getSessionStore();
	SessionStore.startReaper();
	this.sessionStore = new SessionStore();
	
	//create a local storage object
	this.localStorage = {};
};

SessionHandler.HANDLER_PATH   = path.join(DOCUMENT_ROOT, 'include', 'session', 'storage', path.sep);
SessionHandler.HANDLER_SUFFIX = '_session_store.js';
SessionHandler.SID_KEY        = 'uid';
SessionHandler.TIMEOUT_KEY    = 'timeout';
SessionHandler.COOKIE_HEADER  = 'parsed_cookies';

SessionHandler.prototype.open = function(request, output){
	
	//check for active
	var sid = SessionHandler.getSessionIdFromCookie(request);
	if (!sid) {
		cb(null, SessionHandler.create(request));
		return;
	}
	
	//check in local storage
	var session = null;
	if (this.isLocal(sid)) {
		session = this.gl(sid);
		this.setLocal(session);
		cb(null, session);
		return;
	}
	
	//session not available locally so check persistent storage
	this.sessionStore.get(sid, function(err, result){
		if(err){
			cb(err, null);
			return;
		}
		else if(result){
			cb(null, result);
			return;
		}
		
		//session not found create one
		cb(null, SessionHandler.create(request));
	});
};

SessionHandler.prototype.close = function(session, cb) {
	if(!session){
		throw new Error("SessionHandler: Cannot close an empty session");
	}
	
	if(typeof session != 'object'){
		session = this.gl(session);
		if(!session) {
			throw new Error("SessionHandler: The session has not been opened or is already closed");
		}
	}
	
	//update timeout
	session[SessionHandler.TIMEOUT_KEY] = new Date().getTime() + pb.confi.session.timeout;
	
	//last active request using this session, persist it back to storage
	if(this.purgeLocal(session[SessionHandler.SID_KEY])){
		this.sessionStore.set(session, cb);
		return;
	}
	
	//another request is using the session object so just call back OK
	cb(null, true);
};

/**
 * 
 * NOTE: This function should only be called <b>AFTER</b> SessionHandler.open 
 * is called and callsback successfully.
 * @param sessionId
 * @returns
 */
SessionHandler.prototype.gl = function(sessionId){
	var localSession = this.localStorage[sessionId];
	return localSession ? localSession.session : null;
};

SessionHandler.prototype.setLocal = function(session){
	var sid = session[SessionHandler.SID_KEY];
	if (this.isLocal(sid)) {
		this.localStorage[sid].request_count += 1;
	}
	else{
		this.localStorage[sid] = {
			request_count: 1,
			session: session
		};
	}
};

SessionHandler.prototype.purgeLocal = function(sessionId){
	if (!this.isLocal(sessionId)) {
		throw new Error("SessionHandler: The session was never opened or the session is already closed");
	}
	
	//decrement request count
	this.localStorage[sessionId].request_count -= 1;
	
	//qualifies for local purge if request count is at 0
	var doesQualify = this.localStorage[sessionId].request_count;
	if (doesQualify) {
		delete this.localStorage[sessionId];
	}
	return doesQualify;
};

SessionHandler.prototype.isLocal = function(sessionId){
	return this.localStorage.hasOwnProperty(sessionId);
};

SessionHandler.prototype.getSession = function(request, output){
	global.getSession(request, output);
};

SessionHandler.prototype.createSession = function(request, output){
	global.createSession(request, output);
};

SessionHandler.prototype.editSession = function(request, session, unsets, output){
	global.editSession(request, session, usets, output);
};

SessionHandler.prototype.closeSession = function(session, output){
	global.closeSession(session, output);
};

SessionHandler.prototype.shutdown = function(){
	SessionHandler.SessionStore.shutdown();
};

SessionHandler.prototype.create = function(request){
	var session = {
		authentication: {
			user_id: null,
			permissions: []
		},
		ip: request.connection.remote_address,
		client_id: SessionHandler.getClientId(request)
	};
	session[SessionHandler.SID_KEY] = pb.utils.uniqueId();
	
	this.setLocal(session);
	return session;
};

SessionHandler.getClientID = function(request){
	return global.getClientID(request);
};

SessionHandler.getEmptySessionCookie = function(){
	return global.getEmptySessionCookie();
};

/**
 * Loads a session store based on the configuration.
 * @throws {Error} when the defined session store can not be loaded
 * @returns
 */
SessionHandler.getSessionStore = function(){
	var possibleStores = [
          SessionHandler.HANDLER_PATH+ pb.config.session.storage + SessionHandler.HANDLER_SUFFIX,
          pb.config.session.storage
     ];
 	
 	var sessionStorePrototype = null;
 	for(var i = 0; i < possibleStores.length; i++){
 		try{
 			sessionStorePrototype = require(possibleStores[i]);;
 			break;
 		}
 		catch(e){
 			pb.log.debug("SessionHandler: Failed to load "+possibleStores[i]);
 		}
 	}
 	
 	//ensure session store was loaded
 	if (sessionStorePrototype == null){
		throw new Error("Failed to initialize a session store. Choices were: "+JSON.stringify(possibleStores));
	}
 	return sessionStorePrototype;
};

/**
 * Extracts the session id from the returned cookie
 * @param request The object that describes the incoming user request
 * @returns {string} Session Id if available NULL if it cannot be found
 */
SessionHandler.getSessionIdFromCookie = function(request){
	
	var sessionId = null;
	if (request.headers[SessionHandler.COOKIE_HEADER]) {
        
		// Discovered that sometimes the cookie string has trailing spaces
        for(var key in request.headers[SessionHandler.COOKIE_HEADER]){
        	if(key.trim() == 'session_id'){
                sessionId = request.headers[SessionHandler.COOKIE_HEADER][key];
                break;
            }
        }
    }
	return sessionId;
};

//do module exports
module.exports = SessionHandler;
