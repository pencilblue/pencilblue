/*
    Copyright (C) 2015  PencilBlue, LLC

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

//dependencies
var util = require('../../util.js');

/**
 * @module Session
 */
module.exports = function RedisSessionStoreModule(pb) {

    /**
     * Session storage backed by Redis
     *
     * @class RedisSessionStore
     * @constructor
     */
    function RedisSessionStore(){};

    /**
     * The prefix to prepend to the session ID in order to construct a cache key
     * @static
     * @readonly
     * @property SESSION_KEY_PREFIX
     * @type {String}
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
            cb(err, result ? JSON.parse(result) : null);
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
        var timeout       = Math.floor(millisFromNow / util.TIME.MILLIS_PER_SEC);
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
     * Repsonsible for ensuring that the mechanism that expires sessions becomes
     * active.
     * @method start
     * @param {Function} cb
     */
    RedisSessionStore.prototype.start = function(cb){
        pb.log.debug("RedisSessionStore: Initialized");
        cb(null, true);
    };
    
    /**
     * Responsable for shutting down the session store and any resources used for
     * reaping expired sessions.
     * @method shutdown
     * @param {Function} cb
     */
    RedisSessionStore.prototype.shutdown = function(cb){
        pb.log.debug("RedisSessionStore: Shutting down...");
        cb(null, true);
    };

    /**
     * Constructs a session cache key provided a session id.
     * @static
     * @method getSessionKey
     * @param {String} sessionId
     * @return {String} [RedisSessionStore.SESSION_KEY_PREFIX][sessionId]
     */
    RedisSessionStore.getSessionKey = function(sessionId){
        return RedisSessionStore.SESSION_KEY_PREFIX + sessionId;
    };
    
    return RedisSessionStore;
};
