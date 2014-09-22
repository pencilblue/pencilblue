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
 * @param {String} [dbName] Will default to the config.db.name DB when not
 * provided.
 * @main Database
 */
function DAO(dbName){

    /**
     * The name of the DB that this instance is intended to interact with.  By
     * default, it goes to the name of the DB provided by system configuration
     * property db.name.
     * @property dbName
     * @type {String}
     */
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
    var options = {
        where: where,
        select: DAO.PROJECT_ALL,
        order: DAO.NATURAL_ORDER,
        limit: 1
    };
	this.q(collection, options, function(err, result){
        cb(err, util.isArray(result) && result.length > 0 ? result[0] : null);
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
		where[DAO.getIdField()] = DAO.getNotIDField(exclusionId);
	}

	//checks to see how many docs were available
	this.count(collection, where, function(err, count) {
		cb(err, count === 0);
	});
};

/**
 * Queries the database
 * @deprecated
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
 * Queries the database
 * @method q
 * @param  {String} collection The type of object to search for
 * @param  {Object} [options] The options for the query
 * @param {Object} [options.where={}] The conditions under which results are 
 * returned
 * @param  {Object} [options.select] Selection type object
 * @param  {Array} [options.order]  Order by array (MongoDB syntax)
 * @param  {Integer} [options.limit] Number of documents to retrieve
 * @param  {Integer} [options.offset] Start index of retrieval
 * @param {Function} [options.handler] A function that takes two paramters.  
 * The first, the Cursor object that contains the results of the query.  The 
 * second is a callback that takes two parameters.  An error if occurred and by 
 * default, the documents returned by the query.  Custom handlers may provide 
 * whatever value it wishes including the cursor if it wishes to handle the 
 * results itself.
 * @param {Function} cb A callback function that takes two parameters.  The 
 * first, an error, if occurred and the second is the result provided by the 
 * handler.  By default it provides an array of objects that represent the 
 * items returned by the query.
 */
DAO.prototype.q = function(collection, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb      = options;
        options = {};
    }
    else if (!pb.utils.isObject(options)) {
        return cb(new Error('OPTIONS_PARAM_MUST_BE_OBJECT')); 
    }
    
    //execute the query
    var cursor = this._doQuery(collection, options.where, options.select, options.order, options.limit, options.offset);
    
    //handle cursor
    var handler = pb.utils.isFunction(options.handler) ? options.handler : this.toArrayCursorHandler;
    handler(cursor, function(err, docs) {

        //close the cursor
        cursor.close(function(err){
            if (util.isError(err)) {
                log.error("DAO: An error occurred while attempting to close the cursor. %s", err.stack);
            }
        });

        //callback with results
        cb(err, docs);
    });
};

/**
 * A cursor handler that iterates over each result from the query that created
 * the cursor and places the result into an array.  The array of documents is
 * provided as the second argument in the callback.
 * @method toArrayCursorHandler
 * @param {Cursor} cursor
 * @param {Function} cb
 */
DAO.prototype.toArrayCursorHandler = function(cursor, cb) {
    cursor.toArray(cb);
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
 * @return {Cursor} The MongoDB cursor that provides the results of the query
 */
DAO.prototype._doQuery = function(entityType, where, select, orderBy, limit, offset) {
	//verify a collection was provided
	if (typeof entityType === 'undefined') {
		throw Error('An entity type must be specified!');
	}

	//set defaults
	where  = where  ? where  : DAO.ANYWHERE;
	select = select ? select : DAO.PROJECT_ALL;
	offset = offset ? offset : 0;

	var cursor = pb.dbm[this.dbName].collection(entityType)
		.find(where, select)
		.skip(offset);

	if (orderBy) {
		cursor.sort(orderBy);
	}

	if (limit) {
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
 * @deprecated
 * @method insert
 * @param  {Object} dbObject The database object to persist
 * @return {Promise} Promise object
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
 * @deprecated
 * @method update
 * @param  {Object} dbObj The new document object
 * @return {Promise} Promise object
 */
DAO.prototype.update = function(dbObj) {

    //log interaction
    if (pb.config.db.query_logging) {
        var msg;
        if (dbObj._id) {
            msg = util.format('UPDATE %s WHERE ID=%s', dbObj.object_type, dbObj._id);
        }
        else {
            msg = util.format('INSERT INTO %s', dbObj.object_type);
        }
        pb.log.info(msg);
    }

	var promise = new Promise();
	DAO.updateChangeHistory(dbObj);
	pb.dbm[this.dbName].collection(dbObj.object_type).save(dbObj, function(err, doc){
		promise.resolve(err ? err : doc);
	});
	return promise;
};

/**
 * Replaces an existing document with the specified DB Object
 * @method save
 * @param {Object} dbObj The system object to persist
 * @param {Object} [options] See http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#save
 * @param {Function} cb A callback that takes two parameters.  The first, an 
 * error, if occurred.  The second is the result of the persistence operation.
 */
DAO.prototype.save = function(dbObj, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb      = options;
        options = {};
    }
    else if (!pb.utils.isObject(options)) {
        return cb(new Error('OPTIONS_PARAM_MUST_BE_OBJECT'));
    }
    if (!pb.utils.isObject(dbObj)) {
        return cb(new Error('The dbObj parameter must be an object'));   
    }
        
    //log interaction
    if (pb.config.db.query_logging) {
        var msg;
        if (dbObj._id) {
            msg = util.format('UPDATE %s WHERE ID=%s', dbObj.object_type, dbObj._id);
        }
        else {
            msg = util.format('INSERT INTO %s', dbObj.object_type);
        }
        pb.log.info(msg);
    }
    
    //ensure an object_type was specified & update common fields
    dbObj.object_type = dbObj.object_type || options.object_type;
    DAO.updateChangeHistory(dbObj);
    
    //execute persistence operation
	pb.dbm[this.dbName].collection(dbObj.object_type).save(dbObj, options, cb);
};

/**
 * Provides a mechanism to save an array of objects all from the same 
 * collection.  The function handles updates and inserts.  The difference is 
 * determined by the truth value of the ID field of each object.  
 * @method saveBatch
 * @param {Array} objArray The array of objects to persist
 * @param {String} collection The collection to persist the objects to
 * @param {Object} [options] See http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#initializeunorderedbulkop 
 * @param {Function} cb A callback that takes two arguments.  The first is an 
 * error, if occurred. The second is the second parameter of the callback 
 * described here: http://mongodb.github.io/node-mongodb-native/api-generated/unordered.html#execute
 */
DAO.prototype.saveBatch = function(objArray, collection, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb      = options;
        options = {
            useLegacyOps: true
        };
    }
    else if (!pb.utils.isObject(options)) {
        return cb(new Error('OPTIONS_PARAM_MUST_BE_OBJECT'));
    }
    if (!util.isArray(objArray)) {
        return cb(new Error('The objArray parameter must be an Array'));   
    }
    else if (!pb.utils.isString(collection)) {
        return cb(new Error('COLLECTION_MUST_BE_STR'));
    }
    
    //initialize the batch operation
    var col   = pb.dbm[this.dbName].collection(collection);
    var batch = col.initializeUnorderedBulkOp(options);
    
    //build the batch
    for (var i = 0; i < objArray.length; i++) {
        
        var item = objArray[i];
        item.object_type = collection;
        DAO.updateChangeHistory(item);
        if (item[DAO.getIdField()]) {
            batch.update(item);   
        }
        else {
            batch.insert(item);
        }
    }
    batch.execute(cb);
};

/**
 * Updates a specific set of fields. This is handy for performing upserts.
 * @method updateFields
 * @param {String} collection The collection to update object(s) in
 * @param {Object} query The query to execute to find the existing object
 * @param {Object} updates The updates to perform
 * @param {Object} options Any options to go along with the update
 * @param {Boolean} [options.upsert=false] Inserts the object is not found
 * @param {Boolean} [options.multi=false] Updates multiple records if the query
 * finds more than 1
 */
DAO.prototype.updateFields = function(collection, query, updates, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb = options;
        options = {};
    }

    if (pb.config.db.query_logging) {
        pb.log.info('UPDATE %s %s WHERE %s WITH OPTIONS %s', collection, JSON.stringify(updates), JSON.stringify(query), JSON.stringify(options));
    }
    pb.dbm[this.dbName].collection(collection).update(query, updates, options, cb);
};

/**
 * Removes an object from persistence
 *
 * @method deleteById
 * @param {String|ObjectID} oid The Id of the object to remove
 * @param {String} collection The collection the object is in
 * @param {Function} [cb] A callback that takes two parameters.  The first is 
 * an error, if occurred.  The second is the number of records deleted by the 
 * execution of the command.
 * @return {Promise} Promise object iff a callback is not provided
 */
DAO.prototype.deleteById = function(oid, collection, cb) {
    var canUseCb = pb.utils.isFunction(cb);
    
    //error checking
	if (!pb.validation.isId(oid)) {
        
        var err = new Error('An id must be specified in order to delete');
        if (canUseCb) {
            return cb(err);
        }
        else {
            //backward compatibility
            throw err;
        }
	}

	var where = DAO.getIDWhere(oid);
    if (canUseCb) {
        this.delete(where, collection, cb);
    }
    else {
        //used for backward compatibility with old way of using promises.
	   return this.deleteMatching(where, collection);
    }
};

/**
 * Removes objects from persistence that match criteria
 * @deprecated
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
	if(pb.config.db.query_logging){
		pb.log.info("DAO: DELETE FROM "+collection+" WHERE "+JSON.stringify(where));
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
 * Removes objects from persistence that match criteria
 *
 * @method delete
 * @param {Object} where Key value pair object
 * @param {String} collection The collection to search in
 * @param {Object} [options] See http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#remove
 * @param {Function} cb A callback that provides two parameter. The first is an 
 * error, if occurred.  The second is the number of records that were removed 
 * from persistence.
 */
DAO.prototype.delete = function(where, collection, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb = options;
        options = {};
    }
    else if (!pb.utils.isObject(options)) {
        return cb(new Error('OPTIONS_PARAM_MUST_BE_OBJECT'));
    }
    
    //require param error checking
    if (!pb.utils.isObject(where)) {
        return cb(new Error('WHERE_CLAUSE_MUST_BE_OBJECT'));
    }
    else if (!pb.utils.isString(collection)) {
        return cb(new Error('COLLECTION_MUST_BE_STR'));
    }
    
    //log interaction
	if(pb.config.db.query_logging){
		pb.log.info('DAO: DELETE FROM %s WHERE %s', collection, JSON.stringify(where));
	}
    
    //execute delete command
    pb.dbm[this.dbName].collection(collection).remove(where, options, cb);
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
        cb(new Error('COMMAND_MUST_BE_OBJECT'));
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
        cb(new Error('PROCEDURE_MUST_BE_OBJECT'));
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
    	idArray.push(DAO.getObjectID(rawId));
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

/**
 * Transfers a system object from one type to another.  The system specific
 * properties are cleared so that when the object is persisted it will receive
 * its own properties.
 * @static
 * @method transfer
 * @param {Object} obj The object to convert
 * @param {String} to The type to convert it to
 */
DAO.transfer = function(obj, to) {
    if (!pb.utils.isObject(obj) || !pb.utils.isString(to)) {
        throw new Error('OBJ_TO_PARAMS_MUST_BE');
    }

    delete obj._id;
    delete obj.created;
    delete obj.last_modified;
    obj.object_type = to;
};

/**
 * Retrieves the field in system objects that represents the unique identifier.
 * The default implementation returns the mongo field '_id'.
 * @static
 * @method getIdField
 * @return {String} '_id'
 */
DAO.getIdField = function() {
    return '_id';
};

//exports
module.exports = DAO;
