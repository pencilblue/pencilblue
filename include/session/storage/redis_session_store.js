/**
 * 
 * @returns
 */
function RedisSessionStore(){

};

RedisSessionStore.SESSION_KEY_PREFIX = 'user-session-';

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

RedisSessionStore.prototype.set = function(session){
	var sid  = RedisSessionStore.getSessionKey(session[SessionHandler.SID_KEY]);
	var json = JSON.stringify(session);
	pb.cache.set(sid, json, pb.config.session.timeout, cb);
};

RedisSessionStore.prototype.clear = function(sessionId, cb){
	var sid = RedisSessionStore.getSessionKey(sessionId);
	pb.cache.del(sid, cb);
};

RedisSessionStore.getSessionKey = function(sessionId){
	return RedisSessionStore.SESSION_KEY_PREFIX + sessionId;
};

module.exports = RedisSessionStore;