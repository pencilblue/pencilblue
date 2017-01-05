/*
    Copyright (C) 2016  PencilBlue, LLC

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
'use strict';

//dependencies
var CacheFactory = require('../../dao/cache');
var DateUtils = require('../../../lib/utils/dateUtils');
var log = require('../../utils/logging').newInstance('RedisSesionStore');
var Q = require('q');

/**
 * Session storage backed by Redis
 *
 * @class RedisSessionStore
 * @constructor
 */
class RedisSessionStore {

    /**
     * The prefix to prepend to the session ID in order to construct a cache key
     * @readonly
     * @type {String}
     */
    static get SESSION_KEY_PREFIX() {
        return 'user-session-';
    }

    /**
     * Responsible for retrieving the session for persistent storage.
     * @param {String} sessionId The identifier of the session to retrieve.
     * @param {Function} cb Callback of form cb(err, [Object])
     */
    get (sessionId, cb) {

        var sid = RedisSessionStore.getSessionKey(sessionId);
        CacheFactory.getInstance().get(sid, function (err, result) {
            cb(err, result ? JSON.parse(result) : null);
        });
    }

    /**
     * Responsable for persisting the session object between user requests
     * @param {Object} session The session object to store.  The session object must contain
     * the following in addition to other data:
     * <pre>
     * {
     * 	uid: [primitive]
     * }
     * </pre>
     * @param {Function} cb Callback of form cb(err, 'OK')
     */
    set (session, cb) {
        var sid = RedisSessionStore.getSessionKey(session.uid);
        var json = JSON.stringify(session);

        //in seconds
        var millisFromNow = session.timeout - new Date().getTime();
        var timeout = Math.floor(millisFromNow / DateUtils.MILLIS_PER_SEC);
        CacheFactory.getInstance().setex(sid, timeout, json, cb);
    }

    /**
     * Deletes a session if it exists.
     * @param {String} sessionId
     * @param {Function} cb Callback of form cb(err, [int SESSIONS_CLEARED])
     */
    clear (sessionId, cb) {
        var sid = RedisSessionStore.getSessionKey(sessionId);
        CacheFactory.getInstance().del(sid, cb);
    }

    /**
     * Repsonsible for ensuring that the mechanism that expires sessions becomes
     * active.
     * @param {Function} cb
     */
    start (cb) {
        log.debug('RedisSessionStore: Initialized');
        cb(null, true);
    }

    /**
     * Responsable for shutting down the session store and any resources used for
     * reaping expired sessions.
     * @param {Function} cb
     */
    shutdown () {
        log.debug('RedisSessionStore: Shutting down...');
        return Q.resolve(true);
    }

    /**
     * Constructs a session cache key provided a session id.
     * @param {String} sessionId
     * @return {String} [RedisSessionStore.SESSION_KEY_PREFIX][sessionId]
     */
    static getSessionKey (sessionId) {
        return RedisSessionStore.SESSION_KEY_PREFIX + sessionId;
    }
}

module.exports = RedisSessionStore;
