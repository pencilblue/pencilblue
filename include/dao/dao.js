/**
 * DAO
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2013, All Rights Reserved
 */
function DAO(dbName){
	this.dbName  = typeof dbName  !== 'undefined' ? dbName : MONGO_DATABASE;
}

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
 */
DAO.prototype.query = function(entityType, where, select, orderby, limit, offset){
	//verify a collection was provided
	if (typeof entityType === 'undefined') {
		throw Error('An entity type must be specified!');
	}
	
	//set defaults
	where  = typeof where  !== 'undefined' ? where : {};
	select = typeof select !== 'undefined' ? select : {};
	offset = typeof offset !== 'undefined' ? offset : 0;

	var cursor = dbm[this.dbName].collection(entityType)
		.find(where, select)
		.skip(offset);
	
	if (typeof orderBy !== 'undefined') {
		cursor.sort(orderBy);
	}
		
	if (typeof limit !== 'undefined') {
		cursor.limit(limit);
	}
	
	var promise = new Promise();
	cursor.toArray(function(err, docs)
    {
        promise.resolve(err ? err : docs);
    });
	return promise;
};

module.exports = DAO;