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
var path   = require('path');
var crypto = require('crypto');
var util   = require('../util.js');
const Promise = require('bluebird');

/**
 * Tools for session storage
 *
 * @module Session
 */
module.exports = function SessionModule(pb) {
    /**
     * Responsible for managing user sessions
     *
     * @module Session
     * @class SessionHandler
     * @constructor
     * @param {SessionStore} sessionStore
     */
    function SessionHandler(sessionStore){

        //ensure a session store was started
        Promise.promisifyAll(sessionStore);
        this.sessionStore = sessionStore;
    }

    /**
     *
     * @static
     * @readonly
     * @property HANDLER_PATH
     * @type {String}
     */
    SessionHandler.HANDLER_PATH = path.join(pb.config.docRoot, 'include', 'session', 'storage', path.sep);

    /**
     *
     * @static
     * @readonly
     * @property HANDLER_SUFFIX
     * @type {String}
     */
    SessionHandler.HANDLER_SUFFIX = '_session_store.js';

    /**
     *
     * @static
     * @readonly
     * @property SID_KEY
     * @type {String}
     */
    SessionHandler.SID_KEY = 'uid';

    /**
     *
     * @static
     * @readonly
     * @property TIMEOUT_KEY
     * @type {String}
     */
    SessionHandler.TIMEOUT_KEY = 'timeout';

    /**
     *
     * @static
     * @readonly
     * @property COOKIE_HEADER
     * @type {String}
     */
    SessionHandler.COOKIE_HEADER = 'parsed_cookies';

    /**
     *
     * @static
     * @readonly
     * @property COOKIE_NAME
     * @type {String}
     */
    SessionHandler.COOKIE_NAME = 'cms_tn_session_id';

    /**
     *
     * @method start
     * @param {Function} cb
     */
    SessionHandler.prototype.start = function(cb) {
        this.sessionStore.start(cb);
    };

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
            return cb(null, this.create(request));
        }

        //session not available locally so check persistent storage
        var handler = this;
        this.sessionStore.get(sid, function(err, result){
            if(err || result){
                return cb(err, result);
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
            throw new Error("SessionHandler: The session has not been opened or is already closed");
        }

        //update timeout
        session[SessionHandler.TIMEOUT_KEY] = new Date().getTime() + pb.config.session.timeout;

        if (session.end) {
            return this.sessionStore.clear(session.uid, cb);
        }
        this.sessionStore.set(session, cb);
    };

    SessionHandler.prototype.merge = function(sid, mergeFn, cb) {
        if (!mergeFn || !mergeFn instanceof Function) {
            return Promise.reject(new Error('SessionHandler: Invalid merge function')).asCallback(cb);
        }

        return Promise.using(this.sessionStore.lock(sid), _lock => {
            return this.sessionStore.getAsync(sid)
                .then(mergeFn)
                .then(Promise.promisify(this.close).bind(this))
        }).asCallback(cb)
    }

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
                admin_level: pb.SecurityService.ACCESS_USER
            },
            ip: SessionHandler.getRemoteIP(request),
            client_id: SessionHandler.getClientId(request)
        };
        session[SessionHandler.SID_KEY] = util.uniqueId();
        return session;
    };

    /**
     * Shuts down the sesison handler and the associated session store
     * @method shutdown
     * @param {Function} cb
     */
    SessionHandler.prototype.shutdown = function(cb){
        cb = cb || util.cb;
        this.sessionStore.shutdown(cb);
    };

    /**
     * Generates a unique client ID based on the user agent and the remote address.
     * @static
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
     * Retrieves user's remote IP address (Returns first address in x-forwarded-for header if using a proxy)
     * @static
     * @method getRemoteIP
     * @param {Object} request
     * @returns {String} User's true remote IP address
     */
    SessionHandler.getRemoteIP = function(request) {
        if(request.headers && request.headers['x-forwarded-for']) {
            var ipList = request.headers['x-forwarded-for'].split(/[\s,]+/);
            if(ipList.length > 0) {
                return ipList[0];
            }
        }

        return request.connection.remoteAddress;
    };

    /**
     * Loads a session store prototype based on the system configuration
     * @static
     * @method getSessionStore
     * @return {Function}
     */
    SessionHandler.getSessionStore = function(){
        var possibleStores = [
            SessionHandler.HANDLER_PATH + pb.config.session.storage + SessionHandler.HANDLER_SUFFIX,
            pb.config.session.storage
        ];

        var SessionStoreModule = null;
        for(var i = 0; i < possibleStores.length; i++){
            try{
                SessionStoreModule = require(possibleStores[i]);
                break;
            }
            catch(e){
                pb.log.silly("SessionHandler: Failed to load "+possibleStores[i]);
            }
        }

        //ensure session store was loaded
        if (SessionStoreModule === null){
            throw new Error(`Failed to initialize a session store. Exhausted possibilities: ${JSON.stringify(possibleStores)}`);
        }
        return SessionStoreModule(pb);
    };

    /**
     * Retrieves an instance of the SessionStore specified in the sytem configuration
     * @static
     * @method getSessionStore
     * @return {SessionStore}
     */
    SessionHandler.getSessionStoreInstance = function() {
        var SessionStorePrototype = SessionHandler.getSessionStore();
        return new SessionStorePrototype();
    };

    /**
     * Extracts the session id from the returned cookie
     * @static
     * @method getSessionIdFromCookie
     * @param {Object} request The object that describes the incoming user request
     * @return {string} Session Id if available NULL if it cannot be found
     */
    SessionHandler.getSessionIdFromCookie = function(request){
        let sessionId = null;

        let cookieHeader = request.headers[SessionHandler.COOKIE_HEADER];
        if (cookieHeader) {
            let key = Object.keys(cookieHeader).find(x => x.trim() === SessionHandler.COOKIE_NAME) ||
                Object.keys(cookieHeader).find(x => x.trim() === 'session_id');
            if (key) {
                return cookieHeader[key];
            }
        }
        return sessionId;
    };

    /**
     *
     * @static
     * @method getSessionCookie
     * @param {Object} session
     * @return {Object}
     */
    SessionHandler.getSessionCookie = function(session) {
        return {[SessionHandler.COOKIE_NAME]: session.uid, path: '/'};
    };

    return SessionHandler;
};
