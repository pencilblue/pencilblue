/*
    Copyright (C) 2017  PencilBlue, LLC

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
var _ = require('lodash');
var Configuration = require('../../config');
var log = require('../../utils/logging').newInstance('MongoSessionStore');
var DateUtils = require('../../../lib/utils/dateUtils');

module.exports = function MongoSessionStoreModule(pb) {

    /**
     * Session storage backed by MongoDB
     *
     * @module Session
     * @class MongoSessionStore
     * @constructor
     */
    class MongoSessionStore {

        /**
         * The mongo collection that stores the sessions
         * @private
         * @static
         * @readonly
         * @property SESSION_COLLECTION_NAME
         * @type {String}
         */
        static get SESSION_COLLECTION_NAME() {
            return 'session';
        }

        /**
         * The cache lock key used when the index is needed to be modified
         * @private
         * @static
         * @readonly
         * @property INDEX_MOD_LOCK_KEY
         * @type {String}
         */
        static get INDEX_MOD_LOCK_KEY() {
            return 'MONGO_SESSION_STORE_INDEX_MOD_LOCK';
        }

        /**
         * Responsible for retrieving the session for persistent storage.
         *
         * @method get
         * @param {String} sessionId The identifier of the session to retrieve.
         * @param {Function} cb Callback of form cb(err, [Object])
         */
        get(sessionId, cb) {
            var dao = new pb.DAO();
            dao.loadByValue('uid', sessionId, MongoSessionStore.SESSION_COLLECTION_NAME, MongoSessionStore.getHandler(cb));
        }

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
        set (session, cb) {
            //ensure an object type is set
            session.object_type = MongoSessionStore.SESSION_COLLECTION_NAME;
            session.timeout = new Date(session.timeout);

            //persist the session
            var dao = new pb.DAO();
            dao.save(session, cb);
        }

        /**
         * Deletes a session if it exists.
         *
         * @method clear
         * @param {String} sessionId
         * @param {Function} cb Callback of form cb(err, [int SESSIONS_CLEARED])
         */
        clear(sessionId, cb) {
            var dao = new pb.DAO();
            dao.delete(MongoSessionStore.getSessionQuery(sessionId), MongoSessionStore.SESSION_COLLECTION_NAME, cb);
        }

        /**
         * Responsable for shutting down the session store and any resources used for
         * reaping expired sessions.
         * @method shutdown
         * @param {Function} cb
         */
        shutdown(cb) {
            log.debug('MongoSessionStore: Shutting down...');
            cb(null, true);
        }

        /**
         * Responsable for ensuring that the mechanism that expires sessions becomes
         * active.
         * @method start
         */
        start(cb) {
            var self = this;

            //prepare index values
            var expiry = Math.floor(Configuration.activeConfiguration.session.timeout / DateUtils.MILLIS_PER_SEC);
            var procedure = {
                collection: SESSION_COLLECTION_NAME,
                spec: {timeout: 1},
                options: {expireAfterSeconds: expiry}
            };

            //ensure an index exists.  According to the MongoDB documentation ensure
            //index cannot modify a TTL value once it is created.  Therefore, we have
            //to ensure that the index exists and then verify that the expiry matches.
            //When it doesn't match we must create a system lock, drop the index, and
            //recreate it.  Due to the permissions levels of some mongo hosting
            //providers the collMod command cannot be used.
            var TTLIndexHelper = require('../../dao/mongo/ttl_index_helper.js')(pb);
            var helper = new TTLIndexHelper();
            helper.ensureIndex(procedure, cb);
        }

        /**
         * Constructs a query to find a session in Mongo
         * @method getSessionQuery
         * @param {String} sessionId The session identifier
         * @return {Object}
         */
        static getSessionQuery(sessionId) {
            return {
                uid: sessionId
            };
        }

        /**
         * @static
         * @method getHandler
         * @param {Function} cb
         * @return {Function}
         */
        getHandler(cb) {
            return function (err, session) {
                if (session && _.isDate(session.timeout)) {
                    session.timeout = session.timeout.getTime();
                }
                cb(err, session);
            };
        }
    }

    return MongoSessionStore;
};
