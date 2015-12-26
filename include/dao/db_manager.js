/*
    Copyright (C) 2015  PencilBlue, LLC

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

//requirements
var async    = require('async');
var domain   = require('domain');
var mongo    = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var util     = require('../util.js');

module.exports = function DBManagerModule(pb) {

    /**
     * @private
     * @static
     * @readonly
     * @property FILES_NAMESPACE
     * @type {String}
     */
    var FILES_NAMESPACE = 'fs.files';

    /**
     * @private
     * @static
     * @readonly
     * @property CHUNKS_NAMESPACE
     * @type {String}
     */
    var CHUNKS_NAMESPACE = 'fs.chunks';

    /**
     * @private
     * @static
     * @readonly
     * @property SYSTEM_NAMESPACE_PREFIX
     * @type {String}
     */
    var SYSTEM_NAMESPACE_PREFIX = 'system.';

    /**
     * Wrapper that protects against direct access to the active connection pools
     * and DB references.
     *
     * @module Database
     * @class DBManager
     * @constructor
     */
    function DBManager(){

        /**
         * Reference to the system instance of System
         * @private
         * @property system
         * @type {System}
         */
        var system = pb.system;

        /**
         * Keeps track of all active DBs with active connection pools.
         * @private
         * @property dbs
         * @type {Object}
         */
        var dbs  = {};

        /**
         * Retrieves a handle to the specified database.
         * @method getDb
         * @param {String} name The database name
         * @return {Object}     A promise object
         */
        this.getDb = function(name, cb) {
            if (util.isFunction(name)) {
                cb = name;
                name = null;
            }
            if(!name){
                name = pb.config.db.name;
            }

            //when we already have a connection just pass back the handle
            if (this.hasConnected(name)) {
                return cb(null, dbs[name]);
            }

            //clone the config and set the name that is being asked for
            var config  = util.clone(pb.config);
            config.db.name = name;

            //build the connection string for the mongo cluster
            var dbURL   = DBManager.buildConnectionStr(pb.config);
            var options = config.db.options;

            pb.log.debug("Attempting connection to: %s with options: %s", dbURL, JSON.stringify(options));
            var self = this;
            mongo.connect(dbURL, options, function(err, db){
                if (err) {
                    var message = err.name + ': ' + err.message + ' - ' + dbURL + '\nIs your instance running?';
                    return cb(new Error(message));
                }

                self.authenticate(pb.config.db.authentication, db, function(err, didAuthenticate) {
                    if (util.isError(err)) {
                        var message = err.name + ': ' + err.message;
                        return cb(new Error(message));
                    }
                    else if (didAuthenticate !== true && didAuthenticate !== null) {
                        return cb(new Error("Failed to authenticate to db "+name+": "+util.inspect(didAuthenticate)));
                    }

                    //save reference to connection in global connection pool
                    dbs[db.databaseName]  = db;

                    //Indicate the promise was kept.
                    cb(null, db);
                });
            });
        };

        /**
         *
         * @method authenticate
         * @param {Object} auth
         * @param {Db} db
         * @param {Function} cb
         */
        this.authenticate = function(auth, db, cb) {
            if (!util.isObject(auth) || !util.isString(auth.un) || !util.isString(auth.pw)) {
                pb.log.debug('DBManager: An empty auth object was passed for DB [%s]. Skipping authentication.', db.databaseName);
                return cb(null, null);
            }

            db.authenticate(auth.un, auth.pw, auth.options ? auth.options : {}, cb);
        };

        /**
         * Indicates if a connection pool to the specified database has already been
         * initialized
         *
         * @method hasConnected
         * @param {String} name
         * @return {Boolean} Whether the pool has been connected
         */
        this.hasConnected = function(name){
            return dbs.hasOwnProperty(name);
        };

        /**
         * Takes an Array of indexing procedures and delegates them out to paralleled
         * tasks.
         * @method processIndices
         * @param {Array} procedures An array of objects that describe the index to
         * place upon a collection.  The object contains three properties.
         * "collection" a string that represents the name of the collection to build an
         * index for.  "specs" is an object that describes which fields to index.  The
         * keys are the field names and the value is -1 for descending order and 1 for
         * ascending.  "options" is an object that that provides specific index
         * properties such as unique or sparse.  See
         * http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#ensureindex
         * for specific MongoDB implementation details for specs and options.
         * @param {Function} cb A callback that provides two parameters: The first, an
         * Error, if occurred.  Secondly, an object that contains two properties.
         * "result" an array of the results where each object in the array represents
         * the result of the request to ensure the index.  "errors" an array of errors
         * that occurred while indexing.  The function does not terminate after the
         * first error.  Instead it allows all indices to attempt to be created and
         * defer the reporting of an error until the end.
         */
        this.processIndices = function(procedures, cb) {
            var self = this;
            if (!util.isArray(procedures)) {
                return cb(new Error('The procedures parameter must be an array of Objects'));
            }

            this.dropUnconfiguredIndices(procedures, function(err) {
                if(util.isError(err)) {
                    return cb(new Error(util.format('DBManager: Error occurred during index check/deletion ERROR[%s]', err.stack)));
                }
                self.ensureIndices(procedures, cb);
            });
        };

        /**
         * Ensures all indices declared are defined on Mongo server
         * @method ensureIndices
         * @param {Array} procedures
         * @param {Function} cb
         */
        this.ensureIndices = function (procedures, cb) {
            //to prevent a cirular dependency we do the require for DAO here.
            var DAO = require('./dao.js')(pb);
            //create the task list for executing indices.
            var errors = [];
            var tasks = util.getTasks(procedures, function(procedures, i) {
                return function(callback) {
                    var dao = new DAO();
                    dao.ensureIndex(procedures[i], function(err, result) {
                        if (util.isError(err)) {
                            errors.push(err);
                            pb.log.error('DBManager: Failed to create INDEX=[%s] RESULT=[%s] ERROR[%s]', JSON.stringify(procedures[i]), util.inspect(result), err.stack);
                        }
                        else if (pb.log.isDebug()) {
                            pb.log.silly('DBManager: Attempted to create INDEX=[%s] RESULT=[%s]', JSON.stringify(procedures[i]), util.inspect(result));
                        }
                        callback(null, result);
                    });
                };
            });
            async.parallel(tasks, function(err, results){
                var result = {
                    errors: errors,
                    results: results
                };
                cb(err, result);
            });
        };


        /**
         * Sorts through all created indices and drops any index not declared in pb.config
         * @method dropUnconfiguredIndices
         * @param {Array} procedures
         * @param {Function} cb
         */
        this.dropUnconfiguredIndices = function(procedures, cb) {
            var self = this;
            //to prevent a cirular dependency we do the require for DAO here.
            var DAO = require('./dao.js')(pb);
            this.getStoredIndices(function(err, storedIndices) {
                if(util.isError(err)) {
                    cb(new Error('DBManager: Failed to get stored indices ERROR[%s]', err.stack));
                    return;
                }
                var dao = new DAO();

                var tasks = util.getTasks(storedIndices, function(indices, i) {
                    return function(callback) {
                        var index = indices[i];

                        //special condition: When mongo is used as the media
                        //storage provider two special collections are created:
                        //"fs.chunks" and "fs.files".  These indices should be
                        //left alone and ignored.
                        if (DBManager.isProtectedIndex(index.ns)) {
                            pb.log.silly("DBManager: Skipping protected index for %s", index.ns);
                            return callback();
                        }

                        var filteredIndex = procedures.filter(function(procedure) {
                            var ns = pb.config.db.name + '.' + procedure.collection;
                            var result = ns === index.ns && self.compareIndices(index, procedure);
                            return result;
                        });
                        var indexCollection = index.ns.split('.')[1];

                        //ignore any index relating to the "_id" field.
                        //ignore all indices of the "session" collection as it is managed elsewhere.
                        //use length and null/undefined check for if the index in question is defined in pb.config.indices.
                        if(index.name === '_id_' || indexCollection === 'session' || (filteredIndex.length !== 0 && !util.isNullOrUndefined(filteredIndex))) {
                            return callback();
                        }

                        dao.dropIndex(indexCollection, index.name, function (err, result) {
                            if (util.isError(err)) {
                                pb.log.error('DBManager: Failed to drop undeclared INDEX=[%s] RESULT=[%s] ERROR[%s]', JSON.stringify(index), util.inspect(result), err.stack);
                            }
                            callback(err, result);
                        });
                    };
                });
                async.parallel(tasks, cb);
            });
        };

        /**
         * Compares an index stored in Mongo to an index declared in pb.config
         * @method compareIndices
         * @param {Object} stored
         * @param {Object} defined
         * @returns {boolean}
         */
        this.compareIndices = function(stored, defined) {
            var keys = Object.keys(stored.key);
            var specs = Object.keys(defined.spec);
            var result =  JSON.stringify(keys) === JSON.stringify(specs);
            return result;

        };

        /**
         * Yields all indices currently in the entire database
         * @method getStoredInidices
         * @param {Function} cb
         */
        this.getStoredIndices = function(cb) {
            dbs[pb.config.db.name].collections(function(err, collections) {
                var tasks = util.getTasks(collections, function(collections, i) {
                    return function(callback) {
                        collections[i].indexes(function(err, indexes) {
                            if(util.isError(err)) {
                                pb.log.error("Error retrieving indices from db: " + err);
                            }
                            callback(err, indexes);
                        });
                    };
                });
                async.parallel(tasks, function(err, results) {
                    cb(err, Array.prototype.concat.apply([], results));
                });
            });
        };

        this.processMigration = function(cb) {
            var DBMigrate = require('./db_migrate.js')(pb);
            new DBMigrate().run(cb);
        };

        /**
         * Iterates over all database handles and call's their shutdown function.
         *
         * @method shutdown
         * @param {Function} cb Callback function
         * @return {Array}      Array of promise objects, one for each shutdown call
         */
        this.shutdown = function(cb){
            cb = cb || util.cb;

            var tasks = util.getTasks(Object.keys(dbs), function(keys, i) {
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


        //constructor specific logic
        //register for shutdown
        system.registerShutdownHook('DBManager', this.shutdown);
    };

    /**
     * The protocol prefix for connecting to a mongo cluster
     * @private
     * @static
     * @readonly
     * @property PROTOCOL_PREFIX
     * @type {Object}
     */
    var PROTOCOL_PREFIX = 'mongodb://';

    /**
     *
     * @static
     * @method buildConnectionStr
     * @param {Object} config
     * @param {Array} config.servers
     * @param {String} config.name
     * @return {String}
     */
    DBManager.buildConnectionStr = function(config) {
        var str = PROTOCOL_PREFIX;
        var options = '?';
        for (var i = 0; i < config.db.servers.length; i++) {

            //check for prefix for backward compatibility
            var hostAndPort = config.db.servers[i];
            if (hostAndPort.indexOf(PROTOCOL_PREFIX) === 0) {
                hostAndPort = hostAndPort.substring(PROTOCOL_PREFIX.length);
            }

            //check for options
            var parts = hostAndPort.split('?');
            if (parts.length > 1) {
                options += (options.length > 1 ? '&' : '') + parts[1];
            }
            hostAndPort = parts[0];

            if (i > 0) {
                str += ',';
            }
            str += hostAndPort;
        };
        return pb.UrlService.urlJoin(str, config.db.name) + options;
    };

    /**
     *
     * @static
     * @method isProtectedIndex
     * @param {String} indexNamespace
     * @return {Boolean}
     */
    DBManager.isProtectedIndex = function(indexNamespace) {
        return indexNamespace.indexOf(FILES_NAMESPACE, indexNamespace.length - FILES_NAMESPACE.length) !== -1 ||
        indexNamespace.indexOf(CHUNKS_NAMESPACE, indexNamespace - CHUNKS_NAMESPACE.length) !== -1 ||
        indexNamespace.indexOf(SYSTEM_NAMESPACE_PREFIX) !== -1;
    };

    //exports
    return DBManager;
};
