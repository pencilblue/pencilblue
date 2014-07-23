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
 * Controlls the data model
 *
 * @module Database
 * @class DAO
 * @constructor
 * @param {String} [dbName] Will default to the config.db.name DB when not provided.
 * @main Database
 */
function DAO(dbName){
	this.dbName  = typeof dbName  !== 'undefined' ? dbName : pb.config.db.name;
}

/**
 * Static variable to indicate that all indices of a document should be
 * retrieved
 *
 * @property PROJECT_ALL
 * @type {Object}
 */
DAO.PROJECT_ALL   = {};
/**
 * Static variable to indicate that documents should be retrieve from anywhere
 *
 * @property ANYWHERE
 * @type {Object}
 */
DAO.ANYWHERE      = {};
/**
 * Static variable to indicate that documents should be returned in their
 * natural order
 *
 * @property NATURAL_ORDER
 * @type {Array}
 */
DAO.NATURAL_ORDER = [];

/**
 * Static varible to sort ascending
 *
 * @property ASC
 * @type {Number}
 */
DAO.ASC  = 1;
/**
 * Static variable to sort descending
 *
 * @property DESC
 * @type {Number}
 */
DAO.DESC = -1;

/**
 * Retrieves an object by ID
 *
 * @method loadById
 * @param {String}   id         The unique id of the object
 * @param {String}   collection The collection the object is in
 * @param {Function} cb         Callback function
 */
DAO.prototype.loadById = function(id, collection, cb){
	this.loadByValues(DAO.getIDWhere(id), collection, cb);
};

/**
 * Retrieves objects matching a key value pair
 *
 * @method loadByValue
 * @param {String}   key        The key to search for
 * @param {*}        val        The value to search for
 * @param {String}   collection The collection to search in
 * @param {Function} cb         Callback function
 */
DAO.prototype.loadByValue = function(key, val, collection, cb) {
	var where = {};
	where[key] = val;
	this.loadByValues(where, collection, cb);
};

/**
 * Retrieves object matching several key value pairs
 *
 * @method loadByValues
 * @param {Object}   where      Key value pair object
 * @param {String}   collection The collection to search in
 * @param {Function} cb         Callback function
 */
DAO.prototype.loadByValues = function(where, collection, cb) {
	this.query(collection, where, DAO.PROJECT_ALL, DAO.NATURAL_ORDER, 1).then(function(result){
		if (util.isError(result)) {
			cb(result, null);
		}
		else {
			cb(null, result.length > 0 ? result[0] : null);
		}
	});
};

/**
 * Gets the count of objects matching criteria
 *
 * @method count
 * @param  {String}   entityType The type of object to search for
 * @param  {Object}   where      Key value pair object
 * @param  {Function} cb         Callback function
 */
DAO.prototype.count = function(entityType, where, cb) {
	this._doQuery(entityType, where).count(cb);
};

/**
 * Determines if an object extists matching criteria
 *
 * @method exists
 * @param  {String}   collection The collection to search in
 * @param  {Object}   where      Key value pair object
 * @param  {Function} cb         Callback function
 */
DAO.prototype.exists = function(collection, where, cb) {
	this.count(collection, where, function(err, count) {
		cb(err, count > 0);
	});
};

/**
 * Determines if there is only a single document that matches the specified query
 *
 * @method unique
 * @param  {String}   collection    The collection to search in
 * @param  {Object}   where         Key value pair object
 * @param  {String}   [exclusionId] Object Id to exclude from the search
 * @param  {Function} cb            Callback function
 */
DAO.prototype.unique = function(collection, where, exclusionId, cb) {
	cb = cb || exclusionId;

	//validate parameters
	if (!pb.utils.isObject(where) || !pb.utils.isString(collection)) {
		cb(new Error("The collection and where parameters are required"), null);
		return;
	}

	//set the exclusion
	if (exclusionId) {
		where._id = {$ne: new ObjectID(exclusionId + '')};
	}

	//checks to see how many docs were available
	this.count(collection, where, function(err, count) {
		cb(err, count === 0);
	});
};

/**
 * Queries the database
 *
 * @method query
 * @param  {String} entityType The type of object to search for
 * @param  {Object} [where]    Key value pair object
 * @param  {Object} [select]   Selection type object
 * @param  {Object} [orderBy]  Order by object (MongoDB syntax)
 * @param  {Integer} [limit]    Number of documents to retrieve
 * @param  {Integer} [offset]   Start index of retrieval
 * @return {Promise}            A promise object
 */
DAO.prototype.query = function(entityType, where, select, orderBy, limit, offset){

	var cursor  = this._doQuery(entityType, where, select, orderBy, limit, offset);
	var promise = new Promise();
	cursor.toArray(function(err, docs){
		var isError = err != null;
        promise.resolve(isError ? err : docs);
        if (isError) {
        	pb.log.error('DAO: ', err.toString());
        }
    });

	//clean up
	cursor.close(function(err){
		if (err) {
			pb.log.error("DAO::Query: An error occurred while attempting to close the cursor. "+err);
		}
	});
	return promise;
};

/**
 * The actual implementation for querying.  The function does not do the same
 * type checking as the wrapper function "query".  This funciton is responsible
 * for doing the heavy lifting and returning the result back to the calling intity.
 * @protected
 * @method _doQuery
 * @param {String} entityType The collection to query
 * @param {Object} [where={}] The where clause
 * @param {Object} [select={}] The fields to project
 * @param {Array} [orderBy] The ordering
 * @param {Integer} [limit] The maximum number of results to return
 * @param {Integer} [offset] The number of results to skip before returning results.
 */
DAO.prototype._doQuery = function(entityType, where, select, orderBy, limit, offset) {
	//verify a collection was provided
	if (typeof entityType === 'undefined') {
		throw Error('An entity type must be specified!');
	}

	//set defaults
	where  = where  ? where  : {};
	select = select ? select : {};
	offset = offset ? offset : 0;

	var cursor = pb.dbm[this.dbName].collection(entityType)
		.find(where, select)
		.skip(offset);

	if (typeof orderBy !== 'undefined') {
		cursor.sort(orderBy);
	}

	if (typeof limit !== 'undefined') {
		cursor.limit(limit);
	}

	if(pb.config.db.query_logging){
		var query = "DAO: SELECT "+JSON.stringify(select)+" FROM "+entityType+" WHERE "+JSON.stringify(where);
		if (typeof orderBy !== 'undefined') {
			query += " ORDER BY "+JSON.stringify(orderBy);
		}
		if (typeof limit !== 'undefined') {
			query += " LIMITY "+JSON.stringify(limit)+", OFFSET "+offset;
		}
		pb.log.info(query);
	}
	return cursor;
};

/**
 * Persists a DB Object for the first time.
 *
 * @method insert
 * @param  {Object} dbObject The database object to persist
 * @return {Promise}          Promise object
 */
DAO.prototype.insert = function(dbObject) {
	var promise = new Promise();

	DAO.updateChangeHistory(dbObject);
	pb.dbm[this.dbName].collection(dbObject.object_type).insert(dbObject, function(err, doc){
		promise.resolve(err ? err : doc[0]);
	});
	return promise;
};

/**
 * Replaces an existing document with the specified DB Object
 *
 * @method update
 * @param  {Object} dbObj The new document object
 * @return {Promise}          Promise object
 */
DAO.prototype.update = function(dbObj) {

	var promise = new Promise();

	DAO.updateChangeHistory(dbObj);
	pb.dbm[this.dbName].collection(dbObj.object_type).save(dbObj, function(err, doc){
		promise.resolve(err ? err : doc);
	});
	return promise;
};

DAO.prototype.updateFields = function(collection, query, updates, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb = options;
        options = {};
    }

    pb.dbm[this.dbName].collection(collection).update(query, updates, options, cb);
};

/**
 * Removes an object from persistence
 *
 * @method deleteById
 * @param {String} oid        The Id of the object to remove
 * @param {String} collection The collection the object is in
 * @return {Promise}           Promise object
 */
DAO.prototype.deleteById = function(oid, collection){
	if (typeof oid === 'undefined') {
		throw new Error('An id must be specified in order to delete');
	}

	var where   = DAO.getIDWhere(oid);
	return this.deleteMatching(where, collection);
};

/**
 * Removes objects from persistence that match criteria
 *
 * @method deleteMatching
 * @param {Object} where      Key value pair object
 * @param {String} collection The collection to search in
 * @return {Object}           Promise object
 */
DAO.prototype.deleteMatching = function(where, collection){
	if (typeof where === 'undefined') {
		throw new Error('A where object must be specified in order to delete');
	}

	//output delete command
	if(pb.log.isDebug()){
		pb.log.debug("DAO: DELETE FROM "+collection+" WHERE "+JSON.stringify(where));
	}

	var promise = new Promise();
	pb.dbm[this.dbName].collection(collection).remove(where, function(err, recordsDeleted) {

        promise.resolve(err ? err : recordsDeleted);
		if(err){
            throw err;
        }
    });
	return promise;
};

/**
 * Sends a command to the DB.
 * http://mongodb.github.io/node-mongodb-native/api-generated/db.html#command
 * @method command
 * @param {Object} The command to execute
 * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
 */
DAO.prototype.command = function(command, cb) {
    if (!pb.utils.isObject(command)) {
        cb(new Error('The command must be a valid object'));
        return;
    }
    pb.dbm[this.dbName].command(command, cb);
};

/**
 * Attempts to create an index.  If the collection already exists then the
 * operation is skipped.
 * http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#ensureindex
 * @method ensureIndex
 * @param {Object} procedure The objects containing the necessary parameters
 * and options to create the index.
 *  @param {String} procedure.collection The collection to build an index for
 *  @param {Object} procedure.spec An object that specifies one or more fields
 * and sort direction for the index.
 *  @param {Object} [procedure.options={}] An optional parameter that can
 * specify the options for the index.
 * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
 */
DAO.prototype.ensureIndex = function(procedure, cb) {
    if (!pb.utils.isObject(procedure)) {
        cb(new Error('A valid procedure object is required in order to execute the indexing operation'));
        return;
    }

    //extract needed values
    var collection = procedure.collection;
    var spec       = procedure.spec;
    var options    = procedure.options || {};

    //create the index (if doesn't exist)
    pb.dbm[this.dbName].collection(collection).ensureIndex(spec, options, cb);
};

/**
 * Creates a basic where clause based on the specified Id
 * @static
 * @method getIDWhere
 * @param {String} oid Object Id String
 * @return {Object}    Where clause
 */
DAO.getIDWhere = function(oid){
	return {
		_id: DAO.getObjectID(oid)
	};
};

/**
 * Creates a where clause that equates to select where [idProp] is in the
 * specified array of values.
 * @static
 * @method getIDInWhere
 * @param {Array} objArray The array of acceptable values
 * @param {String} The property that holds a referenced ID value
 * @return {Object} Where clause
 */
DAO.getIDInWhere = function(objArray, idProp) {
	var idArray = [];
    for(var i = 0; i < objArray.length; i++) {

    	var rawId;
    	if (idProp) {
    		rawId = objArray[i][idProp];
    	}
    	else{
    		rawId = objArray[i];
    	}
    	idArray.push(new ObjectID(rawId));
    }
    return {
    	_id: {$in: idArray}
    };
};


/**
 * Creates a basic where clause based on not equalling the specified Id
 * @static
 * @method getNotIDWhere
 * @param {String} oid Object Id String
 * @return {Object}    Where clause
 */
DAO.getNotIDWhere = function(oid) {
	return {
		_id: DAO.getNotIDField(oid)
	};
};

/**
 * Creates a where clause that indicates to select where the '_id' field does
 * not equal the specified value.
 * @static
 * @method getNotIDField
 * @return {Object} Where clause
 */
DAO.getNotIDField = function(oid) {
	return {$ne: DAO.getObjectID(oid)};
};

/**
 * Creates an MongoDB ObjectID object
 * @static
 * @method getObjectID
 * @param {String} oid Object Id String
 * @return {Object}    ObjectID object
 */
DAO.getObjectID = function(oid) {
	return new ObjectID(oid + '');
};

/**
 * Updates a DB object with a created time stamp and last modified time stamp.
 * @static
 * @method updateChangeHistory
 * @param {Object} dbObject Object to update
 */
DAO.updateChangeHistory = function(dbObject){
	if (typeof dbObject === 'undefined' || dbObject == null) {
		throw new Error("The dbObject parameter is required");
	}

	var now = new Date();
	if (typeof dbObject._id === 'undefined') {
		dbObject.created = now;
	}

	//update for current changes
	dbObject.last_modified = now;
};

//exports
module.exports = DAO;
