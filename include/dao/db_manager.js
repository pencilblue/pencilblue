/**
 * DB Manager
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2013, All Rights Reserved
 */

//requirements
global.mongo    = require('mongodb').MongoClient;
global.format   = require('util').format;
global.ObjectID = require('mongodb').ObjectID;

/**
 * Legacy variable used to reference the main database
 * TODO [PRODUCTION SHOW STOPPER] Remove this once all references are converted 
 * over.
 */
global.mongoDB;

/**
 * Wrapper that protects against direct access to the active connection pools 
 * and DB references.
 */
var DBManager = function() {
	
	/**
	 * Keeps track of all active DBs with active connection pools.
	 */
	var dbs  = {};
	var self = this;
	
	/**
	 * Retrieves a handle to the specified database.  
	 * @returns Promise that will either resolve to the DB handle or the error 
	 * that occurred
	 */
	this.getDB = function(name) {
		var promise = new Promise();
		
		if (dbs.hasOwnProperty(name)) {
			promise.resolve(null, dbs[name]);
		}
		else{
			mongo.connect(MONGO_SERVER + name, function(err, db){
				if(!err){
					//save reference to connection in global connection pool
					dbs[db.databaseName]  = db;
					
					//keep directly accessible reference for instance of DBManager
					self[db.databaseName] = db;
					
					//Indicate the promise was kept.
					promise.resolve(db);
				}
				else {
					//Fulfill promise with error
					promise.resolve(err);
				}
			});
		}
		return promise;
	};
	
	/**
	 * Iterates over all database handles and call's their shutdown function.
	 * @returns Array of promises, one for each shutdown call
	 */
	this.shutdown = function(){
		var promises = [];
		for(var key in dbs){
			
			var entry   = dbs[key];
			var promise = new Promise();
		    entry.close(true, function(err, result){
		    	promise.resolve(err ? err : result);
		    });
		    promises.push(promise);
		}
		dbs = {};
		return promises;
	};
	
	/**
	 * Indicates if a connection pool to the specified database has already been
	 * initialized 
	 * @returns boolean
	 */
	this.hasConnected = function(){
		return dbs.hasOwnProperty(name);
	};
};

//exports
module.exports.DBManager = DBManager;