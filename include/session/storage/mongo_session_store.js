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
var util  = require('../../util.js');
var async = require('async');

module.exports = function MongoSessionStoreModule(pb) {

    /**
     * Session storage backed by MongoDB
     *
     * @module Session
     * @class MongoSessionStore
     * @constructor
     */
    function MongoSessionStore(){}

    /**
     * The mongo collection that stores the sessions
     * @private
     * @static
     * @readonly
     * @property SESSION_COLLECTION_NAME
     * @type {String}
     */
    var SESSION_COLLECTION_NAME = 'session';

    /**
     * The cache lock key used when the index is needed to be modified
     * @private
     * @static
     * @readonly
     * @property INDEX_MOD_LOCK_KEY
     * @type {String}
     */
    var INDEX_MOD_LOCK_KEY = 'MONGO_SESSION_STORE_INDEX_MOD_LOCK';

    /**
     * Responsible for retrieving the session for persistent storage.
     *
     * @method get
     * @param {String} sessionId The identifier of the session to retrieve.
     * @param {Function} cb Callback of form cb(err, [Object])
     */
    MongoSessionStore.prototype.get = function(sessionId, cb){
        var dao = new pb.DAO();
        dao.loadByValue('uid', sessionId, SESSION_COLLECTION_NAME, MongoSessionStore.getHandler(cb));
    };

    /**
     * Responsible for persisting the session object between user requests
     * @param session The session object to store.  The session object must contain
     * the following in addition to other data:
     * <pre>
     * {
     * 	uid: [primitive]
     * }
     * </pre>
     *
     * @method set
     * @param {Function} cb Callback of form cb(err, 'OK')
     */
    MongoSessionStore.prototype.set = function(session, cb){
        //ensure an object type is set
        session.object_type = SESSION_COLLECTION_NAME;
        session.timeout = new Date(session.timeout);

        //persist the session
        var dao = new pb.DAO();
        dao.save(session, cb);
    };

    /**
     * Deletes a session if it exists.
     *
     * @method clear
     * @param {String} sessionId
     * @param {Function} cb Callback of form cb(err, [int SESSIONS_CLEARED])
     */
    MongoSessionStore.prototype.clear = function(sessionId, cb){
        var dao = new pb.DAO();
        dao.delete(MongoSessionStore.getSessionQuery(sessionId), SESSION_COLLECTION_NAME, cb);
    };

    /**
     * Responsable for shutting down the session store and any resources used for
     * reaping expired sessions.
     * @method shutdown
     * @param {Function} cb
     */
    MongoSessionStore.prototype.shutdown = function(cb){
        pb.log.debug("MongoSessionStore: Shutting down...");
        cb(null, true);
    };

    /**
     * Responsable for ensuring that the mechanism that expires sessions becomes
     * active.
     * @method start
     */
    MongoSessionStore.prototype.start = function(cb){
        var self = this;

        //prepare index values
        var expiry    = Math.floor(pb.config.session.timeout / util.TIME.MILLIS_PER_SEC);
        var procedure = {
            collection: SESSION_COLLECTION_NAME,
            spec: { timeout: 1 },
            options: { expireAfterSeconds: expiry }
        }

        //ensure an index exists.  According to the MongoDB documentation ensure
        //index cannot modify a TTL value once it is created.  Therefore, we have
        //to ensure that the index exists and then verify that the expiry matches.
        //When it doesn't match we must create a system lock, drop the index, and
        //recreate it.  Due to the permissions levels of some mongo hosting
        //providers the collMod command cannot be used.
        var TTLIndexHelper = require('../../dao/mongo/ttl_index_helper.js')(pb);
        var helper = new TTLIndexHelper();
        helper.ensureIndex(procedure, cb);
    };

    /**
     * Constructs a query to find a session in Mongo
     * @method getSessionQuery
     * @param {String} sessionId The session identifier
     * @return {Object}
     */
    MongoSessionStore.getSessionQuery = function(sessionId){
        return {
            uid: sessionId
        };
    };

    /**
     * @static
     * @method getHandler
     * @param {Function} cb
     * @return {Function}
     */
    MongoSessionStore.getHandler = function(cb) {
        return function(err, session) {
            if (session && util.isDate(session.timeout)) {
                session.timeout = session.timeout.getTime();
            }
            cb(err, session);
        };
    };

    return MongoSessionStore;
};
