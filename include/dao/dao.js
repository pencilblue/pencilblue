/**
 * DAO
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2013, All Rights Reserved
 */
function DAO(dbName){
	this.dbName  = typeof dbName  !== 'undefined' ? dbName : pb.config.db.name;
}

/**
 * Static variable to indicate that all values of a document should be returned.
 */
DAO.PROJECT_ALL   = {};
DAO.ANYWHERE      = {};
DAO.NATURAL_ORDER = [];

DAO.ASC  = 1;
DAO.DESC = -1;

/**
 * Retrieves an object by ID
 * @param id
 * @param objectType
 * @returns Promise that resolves to a 
 */
DAO.prototype.loadById = function(id, collection, cb){
	this.loadByValues(DAO.getIDWhere(id), collection, cb);
};

DAO.prototype.loadByValue = function(key, val, collection, cb) {
	var where = {};
	where[key] = val;
	this.loadByValues(where, collection, cb);
};

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
 * Retrieves the count based on the specified criteria
 * @param entityType
 * @param where
 * @param cb
 */
DAO.prototype.count = function(entityType, where, cb) {
	this._doQuery(entityType, where).count(cb);
};

/**
 * Determines if a document exists that matches the specified criteria
 * @method exists
 * @param {String} collection
 * @param {Objct} where
 * @param {Function} cb Callback that provides two parameters: cb(Error, Boolean) 
 */
DAO.prototype.exists = function(collection, where, cb) {
	this.count(collection, where, function(err, count) {
		cb(err, count > 0);
	});
};

/**
 * Determines if there is only a single document that matches the specified query
 * @method unique
 * @param {String} collection
 * @param {Objct} where
 * @param {String} [exclusionId]
 * @param {Function} cb Callback that provides two parameters: cb(Error, Boolean) 
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
 * Provides a function to query the database.  
 * TODO determine if we need to enforce an upper bound on limit to prevent misuse.
 * 
 * @param entityType
 * @param where
 * @param select
 * @param orderby
 * @param limit
 * @param offset
 * @returns Promise
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
 * @param dbObject
 * @returns {Promise} that resolves to an Error or a document
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
 * @param dbObj
 * @returns {Promise}
 */
DAO.prototype.update = function(dbObj) {
	
	var promise = new Promise();
	
	DAO.updateChangeHistory(dbObj);
	pb.dbm[this.dbName].collection(dbObj.object_type).save(dbObj, function(err, doc){
		promise.resolve(err ? err : doc);
	});
	return promise;
};

/**
 * Removes an object from persistence.
 * @param oid
 * @param collection
 * @returns {Promise} that resolves to an Error or the number of records deleted 
 * by the call.  The number of records could be undefined or null if the write 
 * concern of the DB is set to "no acknowledgement".
 */
DAO.prototype.deleteById = function(oid, collection){
	if (typeof oid === 'undefined') {
		throw new Error('An id must be specified in order to delete');
	}
	
	var where   = DAO.getIDWhere(oid);
	return this.deleteMatching(where, collection);
};

/**
 * Removes objects from persistence that match the specified where clause.
 * @param where Object describing the criteria for deletion.
 * @param collection
 * @returns {Promise} that resolves to an Error or the number of records deleted 
 * by the call.  The number of records could be undefined or null if the write 
 * concern of the DB is set to "no acknowledgement".
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
 * Creates a where clause based on the specified ID
 * @param oid The string value of the object id
 * @returns {Object} with "_id" parameter and value ObjectId(oid)
 */
DAO.getIDWhere = function(oid){
	return {
		_id: DAO.getObjectID(oid)
	};
};

/**
 * 
 * @param objArray
 * @param idProp
 * @returns {___anonymous5988_6021}
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

DAO.getNotIDWhere = function(oid) {
	return {
		_id: DAO.getNotIDField(oid)
	};
};

DAO.getNotIDField = function(oid) {
	return {$ne: DAO.getObjectID(oid)};
};

DAO.getObjectID = function(oid) {
	return new ObjectID(oid + '');
};

/**
 * Updates a DB object with a created time stamp and last modified time stamp.
 * @param dbObject
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

module.exports = DAO;
