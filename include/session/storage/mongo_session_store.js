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
 * Session storage backed by MongoDB
 *
 * @module Session
 * @class MongoSessionStore
 * @constructor
 */
function MongoSessionStore(){
	pb.log.debug("MongoSessionStore: Initialized");
};

/**
 * The mongo collection that stores the sessions
 */
var SESSION_COLLECTION_NAME = 'session';

/**
 * Responsible for retrieving the session for persistent storage.
 *
 * @method get
 * @param {String} sessionId The identifier of the session to retrieve.
 * @param {Function} cb Callback of form cb(err, [Object])
 */
MongoSessionStore.prototype.get = function(sessionId, cb){
	var dao = new pb.DAO();

	var query = {
		uid: sessionId
	};
	dao.query(SESSION_COLLECTION_NAME, query, pb.DAO.PROJECT_ALL, pb.DAO.NATURAL_ORDER, 1, 0).then(function(result){
		var isError =  typeof result  == 'Error';
		if (isError){
			cb(result, null);
			return;
		}
		cb(null, result.length > 0 ? result[0] : null);
	});
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
	var dao = new pb.DAO();

	//ensure an object type is set
	session.object_type = SESSION_COLLECTION_NAME;

	//persist the session
	dao.update(session).then(function(result){
		var isError =  typeof result  == 'Error';
		cb(isError ? result : null, result);
	});
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
	dao.deleteMatching(MongoSessionStore.getSessionQuery(sessionId), SESSION_COLLECTION_NAME).then(function(result){
		var isError =  typeof result  == 'Error';
		cb(isError ? result : null, result);
	});
};

/**
 * Constructs a query to find a session in Mongo
 *
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
 * Queries for any expired sessions in Mongo and deletes them
 *
 * @method clearExpired
 * @param {Function} cb cb Callback of form cb(err, [int SESSIONS_CLEARED])
 */
MongoSessionStore.clearExpired = function(cb){
	pb.log.debug("MongoSessionStore: Reaping expired sessions...");
	var start = new Date().getTime();

	var dao   = new pb.DAO();
	var query = {
		timeout: {
			"$lte": new Date().getTime()
		}
	};
	dao.deleteMatching(query, SESSION_COLLECTION_NAME).then(function(result){
		pb.log.debug("MongoSessionStore: Expired "+result+" sessions in "+(new Date().getTime() - start)+"ms");
		if (cb){
			cb(null, result);
		}
	});
};

/**
 * Responsable for shutting down the session store and any resources used for
 * reaping expired sessions.
 */
MongoSessionStore.shutdown = function(cb){
	pb.log.debug("MongoSessionStore: Stopping Reaper...");
	clearInterval(TIMEOUT_ID);
	TIMEOUT_ID = null;
    cb(null, true);
};

/**
 * Responsable for ensuring that the mechanism that expires sessions becomes
 * active.
 */
MongoSessionStore.startReaper = function(){
	if(TIMEOUT_ID == null){
		TIMEOUT_ID = setInterval(MongoSessionStore.clearExpired, 30000);
		pb.log.debug("MongoSessionStore: Reaper Interval ID="+TIMEOUT_ID);
	}
};

//set interval for expiring sessions
var TIMEOUT_ID = null;

//set exports
module.exports = MongoSessionStore;
