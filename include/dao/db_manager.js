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
function DBManager(){}
	
/**
 * Keeps track of all active DBs with active connection pools.
 */
var dbs  = {};

/**
 * Retrieves a handle to the specified database.  
 * @returns Promise that will either resolve to the DB handle or the error 
 * that occurred
 */
DBManager.prototype.getDB = function(name) {
    var self = this;
    
    if(!name){
        name = pb.config.db.name;
    }
    var promise = new Promise();

    if (dbs.hasOwnProperty(name)) {
        log.debug("Providing cached instance of DB connection ["+name+"]");
        promise.resolve(dbs[name]);
    }
    else{
        var dbURL   = pb.config.db.servers[0] + name;
        var options = {
            w: pb.config.db.writeConcern	
        };

        pb.log.debug("Attempting connection to: "+dbURL);
        mongo.connect(dbURL, options, function(err, db){
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
 * Indicates if a connection pool to the specified database has already been
 * initialized 
 * @returns boolean
 */
DBManager.prototype.hasConnected = function(){
    return dbs.hasOwnProperty(name);
};

/**
 * Iterates over all database handles and call's their shutdown function.
 * @returns Array of promises, one for each shutdown call
 */
DBManager.shutdown = function(cb){
    cb = cb || pb.utils.cb;
    
    var tasks = pb.utils.getTasks(Object.keys(dbs), function(keys, i) {
        return function(callback) {
            var d = domain.create();
            d.run(function() {
                dbs[keys[i]].close(true, function(err, result) {
                    if (util.isError(err)) {
                        throw err;   
                    }
                    callback(null, result);
                });
            });
            d.on('error', function(err) {
                pb.log.error('DBManager: An error occurred while closing a DB connection. %s', err.stack);
                callback(null, false);
            });
        };
    });
    async.parallel(tasks, cb);
};

//register for shutdown
pb.system.registerShutdownHook('DBManager', DBManager.shutdown);

//exports
module.exports.DBManager = DBManager;