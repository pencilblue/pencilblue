/*
    Copyright (C) 2014  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * Tools for session storage
 *
 * @module Session
 */

/**
 * Responsible for managing user sessions
 *
 * @module Session
 * @class SessionHandler
 * @constructor
 */
function SessionHandler(){

	//ensure a session store was started
	SessionStore = SessionHandler.getSessionStore();
	SessionStore.startReaper();
	this.sessionStore = new SessionStore();

	//create a local storage object
	this.localStorage = {};
};

//private static variables
var SessionStore = null;

//constants
SessionHandler.HANDLER_PATH   = path.join(DOCUMENT_ROOT, 'include', 'session', 'storage', path.sep);
SessionHandler.HANDLER_SUFFIX = '_session_store.js';
SessionHandler.SID_KEY        = 'uid';
SessionHandler.TIMEOUT_KEY    = 'timeout';
SessionHandler.COOKIE_HEADER  = 'parsed_cookies';
SessionHandler.COOKIE_NAME    = 'session_id';

/**
 * Retrieves a session for the current request.  When the session ID is
 * available the existing session is retrieved otherwise a new session is
 * created.
 *
 * @method open
 * @param {Object} request The request descriptor
 * @param {Function} cb The callback(ERROR, SESSION_OBJ)
 */
SessionHandler.prototype.open = function(request, cb){

	//check for active
	var sid = SessionHandler.getSessionIdFromCookie(request);
	if (!sid) {
		cb(null, this.create(request));
		return;
	}

	//check in local storage
	var session = null;
//	if (this.isLocal(sid)) {
//		session = this.gl(sid);
//		this.setLocal(session);
//		cb(null, session);
//		return;
//	}
	
	//session not available locally so check persistent storage
	var handler = this;
	this.sessionStore.get(sid, function(err, result){
		if(err){
			cb(err, null);
			return;
		}
		else if(result){
			handler.setLocal(result);
			cb(null, result);
			return;
		}

		//session not found create one
		cb(null, handler.create(request));
	});
};

/**
 * Closes the session and persists it when no other requests are currently
 * accessing the session.
 *
 * @method close
 * @param {Object} session
 * @param {Function} cb
 */
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
	session[SessionHandler.TIMEOUT_KEY] = new Date().getTime() + pb.config.session.timeout;

	//last active request using this session, persist it back to storage
	//if(this.purgeLocal(session[SessionHandler.SID_KEY])){

		if (session.end) {
			this.sessionStore.clear(session.uid, cb);
		}
		else {
			this.sessionStore.set(session, cb);
		}
		return;
	//}

	//another request is using the session object so just call back OK
	cb(null, true);
};

/**
 * Sets the session in a state that it should be terminated after the last request has completed.
 *
 * @method end
 * @param {Object} session
 * @param {Function} cb
 */
SessionHandler.prototype.end = function(session, cb) {
	session.end = true;
	cb(null, true);
};

/**
 *
 * NOTE: This function should only be called <b>AFTER</b> SessionHandler.open
 * is called and callsback successfully.
 *
 * @method gl
 * @param {String} sessionId
 * @return {Object} Session
 */
SessionHandler.prototype.gl = function(sessionId){
	var localSession = this.localStorage[sessionId];
	return localSession ? localSession.session : null;
};

/**
 * Keeps a reference to the session in memory in case multiple requests come in.
 *
 * @method setLocal
 * @param {Object} session
 */
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

/**
 * Purges the session from local memory unless multiple requests have accessed
 * the session.
 *
 * @method purgeLocal
 * @param {String} sessionId The session identifier
 * @return {Boolean}
 */
SessionHandler.prototype.purgeLocal = function(sessionId){
	if (!this.isLocal(sessionId)) {
		throw new Error("SessionHandler: The session was never opened or the session is already closed");
	}

	//decrement request count
	this.localStorage[sessionId].request_count -= 1;

	//qualifies for local purge if request count is at 0
	var doesQualify = this.localStorage[sessionId].request_count == 0;
	if (doesQualify) {
		delete this.localStorage[sessionId];
	}
	return doesQualify;
};

SessionHandler.prototype.getRequestCount = function(sessionId) {
	if (this.isLocal(sessionId)) {
		return this.localStorage[sessionId].request_count;
	}
	return 0;
};

/**
 * Tests if the session is stored locally
 *
 * @method isLocal
 * @param {String} sessionId The ID of the session to search for
 * @return {boolean} True if the session is stored locally
 */
SessionHandler.prototype.isLocal = function(sessionId){
	return this.localStorage.hasOwnProperty(sessionId);
};

/**
 * Creates the shell of a session object
 *
 * @method create
 * @param request
 * @return {Object} Session
 */
SessionHandler.prototype.create = function(request){
	var session = {
		authentication: {
			user_id: null,
			permissions: [],
			admin_level: ACCESS_USER
		},
		ip: request.connection.remoteAddress,
		client_id: SessionHandler.getClientId(request)
	};
	session[SessionHandler.SID_KEY] = pb.utils.uniqueId();

	this.setLocal(session);
	return session;
};

/**
 * Generates a unique client ID based on the user agent and the remote address.
 *
 * @method getClientId
 * @param {Object} request
 * @return {String} Unique Id
 */
SessionHandler.getClientId = function(request){
    var whirlpool = crypto.createHash('whirlpool');
    whirlpool.update(request.connection.remoteAddress + request.headers['user-agent']);
    return whirlpool.digest('hex');
};

/**
 * Loads a session store based on the configuration.
 *
 * @method getSessionStore
 * @return {Object}
 */
SessionHandler.getSessionStore = function(){
	var possibleStores = [
          SessionHandler.HANDLER_PATH + pb.config.session.storage + SessionHandler.HANDLER_SUFFIX,
          pb.config.session.storage
     ];

 	var sessionStorePrototype = null;
 	for(var i = 0; i < possibleStores.length; i++){
 		try{
 			sessionStorePrototype = require(possibleStores[i]);
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
 *
 * @method getSessionIdFromCookie
 * @param {Object} request The object that describes the incoming user request
 * @return {string} Session Id if available NULL if it cannot be found
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

SessionHandler.getSessionCookie = function(session) {
    return {session_id: session.uid, path: '/'};
};

/**
 * Shuts down the sesison handler and the associated session store
 */
SessionHandler.shutdown = function(cb){
    cb = cb || pb.utils.cb;
	SessionStore.shutdown(cb);
};

//do module exports
module.exports = SessionHandler;
