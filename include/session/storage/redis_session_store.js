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
 * Session storage backed by Redis
 *
 * @module Session
 * @class RedisSessionStore
 * @constructor
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
 *
 * @method get
 * @param {String} sessionId The identifier of the session to retrieve.
 * @param {Function} cb Callback of form cb(err, [Object])
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
 *
 * @method set
 * @param {Object} session The session object to store.  The session object must contain
 * the following in addition to other data:
 * <pre>
 * {
 * 	uid: [primitive]
 * }
 * </pre>
 * @param {Function} cb Callback of form cb(err, 'OK')
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
 *
 * @method clear
 * @param {String} sessionId
 * @param {Function} cb Callback of form cb(err, [int SESSIONS_CLEARED])
 */
RedisSessionStore.prototype.clear = function(sessionId, cb){
	var sid = RedisSessionStore.getSessionKey(sessionId);
	pb.cache.del(sid, cb);
};

/**
 * Constructs a session cache key provided a session id.
 * @param {String} sessionId
 * @return {String} [RedisSessionStore.SESSION_KEY_PREFIX][sessionId]
 */
RedisSessionStore.getSessionKey = function(sessionId){
	return RedisSessionStore.SESSION_KEY_PREFIX + sessionId;
};

/**
 * Responsable for shutting down the session store and any resources used for
 * reaping expired sessions.
 */
RedisSessionStore.shutdown = function(cb){
	pb.log.debug("RedisSessionStore: Shutting down...");
    cb(null, true);
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
