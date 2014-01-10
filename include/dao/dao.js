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

DAO.ASC  = 'asc';
DAO.DESC = 'desc';

/**
 * Retrieves an object by ID
 * @param id
 * @param objectType
 * @param collection
 * @returns Promise that resolves to a 
 */
DAO.prototype.loadById = function(id, objectType, collection){
	collection  = typeof collection  !== 'undefined' ? collection : object_type;
	return query(collection, {_id: ObjectId(id), object_type: objectType});
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
	
	if(pb.log.isDebug()){
		var query = "DAO: SELECT "+JSON.stringify(select)+" FROM "+entityType+" WHERE "+JSON.stringify(where);
		if (typeof orderBy !== 'undefined') {
			query += " ORDER BY "+JSON.stringify(orderBy);
		}
		if (typeof limit !== 'undefined') {
			query += " LIMITY "+JSON.stringify(limit)+", OFFSET "+offset;
		}
		pb.log.debug(query);
	}
	
	var promise = new Promise();
	cursor.toArray(function(err, docs){
        promise.resolve(err ? err : docs);
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
		_id: ObjectID(oid.toString())
	};
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
