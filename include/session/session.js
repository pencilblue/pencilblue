
global.getSession = function (request, output)
{
    var clientID = getClientID(request);
    if(request.headers['parsed_cookies'])
    {
        // Discovered that sometimes the cookie string has trailing spaces
        var sessionID = null;
        for(var key in request.headers['parsed_cookies'])
        {
            if(key.trim() == 'session_id')
            {
                sessionID = request.headers['parsed_cookies'][key];
            }
        }
    
        if(sessionID)
        {
            getDBObjectsWithValues({object_type: 'session', ip: request.connection.remoteAddress, client_id: clientID, uid: sessionID}, function(data)
            {
                if(data.length == 0)
                {
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
    var clientID = getClientID(request);
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

function SessionHandler(){
	var possibleStores = [
         SessionHandler.HANDLER_PATH+ pb.config.session.storage + SessionHandler.HANDLER_SUFFIX,
         pb.config.session.storage
    ];
	
	this.sessionStore = null;
	for(var i = 0; i < possibleStores.length; i++){
		try{
			this.SessionStore = require(possibleStores[i]);
			this.sessionStore = new this.SessionStore();
			break;
		}
		catch(e){
			pb.log.debug("SessionHandler: Failed to load "+possibleStores[i]);
		}
	}
	
	//ensure a session store was started
	if (this.sessionStore == null){
		throw new Error("Failed to initialize a session store. Choices were: "+JSON.stringify(possbileStores));
	}
};

SessionHandler.HANDLER_PATH   = path.join(DOCUMENT_ROOT, 'include', 'session', 'storage', path.sep);
SessionHandler.HANDLER_SUFFIX = '_session_store.js';
SessionHandler.SID_KEY        = 'client_id';


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
	this.SessionStore.shutdown();
};

SessionHandler.getClientID = function(request){
	return global.getClientID(request);
};

SessionHandler.getEmptySessionCookie = function(){
	return global.getEmptySessionCookie();
};

//do module exports
module.exports = SessionHandler;
