/**
 * RedisSessionStore - Session storage backed by Redis
 * @author Brian Hyder <brianhyder@gmail.com>
 */
function RedisSessionStore(){
	pb.log.debug("RedisSessionStore: Initialized");
};

/**
 * The prefix to prepend to the session ID in order to construct a cache key
 */
RedisSessionStore.SESSION_KEY_PREFIX = 'user-session-';

/**
 * Responsable for retrieving the session for persistent storage.  
 * @param sessionId The identifier of the session to retrieve.
 * @param cb Callback of form cb(err, [Object])
 */
RedisSessionStore.prototype.get = function(sessionId, cb){
	
	var sid = RedisSessionStore.getSessionKey(sessionId);
	pb.cache.get(sid, function(err, result){
		if(err){
			cb(err, null);
		}
		else{
			cb(null, JSON.parse(result));
		}
	});
};

/**
 * Responsable for persisting the session object between user requests
 * @param session The session object to store.  The session object must contain 
 * the following in addition to other data:
 * <pre>
 * {
 * 	uid: [primitive]
 * }
 * </pre>
 * @param cb Callback of form cb(err, 'OK')
 */
RedisSessionStore.prototype.set = function(session, cb){
	var sid  = RedisSessionStore.getSessionKey(session.uid);
	var json = JSON.stringify(session);
	
	//in seconds
	var millisFromNow = session.timeout - new Date().getTime();
	var timeout       = Math.floor(millisFromNow / pb.utils.TIME.MILLIS_PER_SEC);
	pb.cache.setex(sid, timeout, json, cb);
};

/**
 * Deletes a session if it exists.
 * @param sessionId
 * @param cb Callback of form cb(err, [int SESSIONS_CLEARED])
 */
RedisSessionStore.prototype.clear = function(sessionId, cb){
	var sid = RedisSessionStore.getSessionKey(sessionId);
	pb.cache.del(sid, cb);
};

/**
 * Constructs a session cache key provided a session id. 
 * @param sessionId
 * @returns {string} [RedisSessionStore.SESSION_KEY_PREFIX][sessionId]
 */
RedisSessionStore.getSessionKey = function(sessionId){
	return RedisSessionStore.SESSION_KEY_PREFIX + sessionId;
};

/**
 * Responsable for shutting down the session store and any resources used for 
 * reaping expired sessions.
 */
RedisSessionStore.shutdown = function(){
	pb.log.debug("RedisSessionStore: Shutting down...");
};

/**
 * Repsonsible for ensuring that the mechanism that expires sessions becomes 
 * active.
 */
RedisSessionStore.startReaper = function(){
	pb.log.debug("RedisSessionStore: Reaper active");
};

//export session store implementation
module.exports = RedisSessionStore;