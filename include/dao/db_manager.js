/*
    Copyright (C) 2016  PencilBlue, LLC

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

//requirements
const _ = require('lodash');
const async = require('async');
const domain = require('domain');
const MongoClient = require('mongodb').MongoClient;
const Q = require('q');
const util = require('util');
const log = require('../utils/logging').newInstance('DbManager');
const Configuration = require('../config');
const IndexService = require('../../lib/dao/mongo/indexService');
const PromiseUtils = require('../../lib/utils/promiseUtils');
const UrlUtils = require('../../lib/utils/urlUtils');
const System = require('../system/system');

/**
 * Keeps track of all active DBs with active connection pools.
 * @private
 * @type {Object}
 */
var dbs  = {};

/**
 * Wrapper that protects against direct access to the active connection pools
 * and DB references.
 */
class DbManager {

    /**
     * @readonly
     * @type {String}
     */
    static get FILES_NAMESPACE () {
        return 'fs.files';
    }

    /**
     * @readonly
     * @type {String}
     */
    static get CHUNKS_NAMESPACE () {
        return 'fs.chunks';
    }

    /**
     * @readonly
     * @type {String}
     */
    static get SYSTEM_NAMESPACE_PREFIX () {
        return 'system.';
    }

    /**
     * Retrieves a handle to the specified database.
     * @method getDb
     * @param {String} [name] The database name
     * @param {function} [cb]
     * @return {Promise} A promise object
     */
    static getDb (name, cb) {
        if (_.isFunction(name)) {
            cb = name;
            name = null;
        }
        if(!name){
            name = Configuration.active.db.name;
        }

        var deferred = Q.defer();
        var done = !!cb ? cb : PromiseUtils.cbHandler(deferred);

        //when we already have a connection just pass back the handle
        if (DbManager.hasConnected(name)) {
            return done(null, dbs[name]);
        }

        //clone the config and set the name that is being asked for
        var configClone  = _.cloneDeep(Configuration.active);
        configClone.db.name = name;

        //build the connection string for the mongo cluster
        var dbURL   = DbManager.buildConnectionStr(Configuration.active);
        var options = configClone.db.options;

        log.debug("Attempting connection to: %s with options: %s", dbURL, JSON.stringify(options));
        MongoClient.connect(dbURL, options).catch(function(err){
            var message = err.name + ': ' + err.message + ' - ' + dbURL + '\nIs your instance running?';
            return done(new Error(message));
        })
        .then(function(db) {
            return DbManager.authenticate(Configuration.active.db.authentication, db).catch(function(err) {
                return done(new Error(err.name + ': ' + err.message));
            }).then(function(didAuthenticate) {
                if (!didAuthenticate) {
                    return done(new Error('Failed to authenticate to db ' + name + ': ' + util.inspect(didAuthenticate)));
                }

                //save reference to connection in global connection pool
                dbs[db.databaseName] = db;

                //Indicate the promise was kept.
                done(null, db);
            });
        });
        return deferred.promise;
    }

    /**
     *
     * @param {Object} auth
     * @param {Db} db
     * @return {Promise} cb
     */
    static authenticate (auth, db) {
        if (!_.isObject(auth) || !_.isString(auth.un) || !_.isString(auth.pw)) {
            log.debug('DBManager: An empty auth object was passed for DB [%s]. Skipping authentication.', db.databaseName);
            return Q.resolve(true);
        }

        return db.authenticate(auth.un, auth.pw, auth.options ? auth.options : {});
    }

    /**
     * Indicates if a connection pool to the specified database has already been
     * initialized
     *
     * @method hasConnected
     * @param {String} name
     * @return {Boolean} Whether the pool has been connected
     */
    static hasConnected (name){
        return typeof dbs[name] !== 'undefined';
    }

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
     * @return {Promise} A promise that fulfils an Array that contains objects. Each object will contain a state
     * parameter with a value of "fulfilled" (success) or "rejected" (failure).
     */
    static processIndices (procedures) {
        if (!Array.isArray(procedures)) {
            return Q.reject(new Error('The procedures parameter must be an array of Objects'));
        }

        return DbManager.dropUnconfiguredIndices(procedures).catch(function(err) {
            return Q.reject(new Error(util.format('DBManager: Error occurred during index check/deletion ERROR[%s]', err.stack)));
        }).then(function() {
            return DbManager.ensureIndices(procedures);
        });
    }

    /**
     * Ensures all indices declared are defined on Mongo server
     * @method ensureIndices
     * @param {Array} procedures
     * @return {Promise}
     */
    static ensureIndices (procedures) {
        return DbManager.getDb().then(function(db) {

            //create the task list for executing indices.
            var tasks = procedures.map(function(procedure, i) {
                return IndexService.ensureIndex(db, procedure).catch(function(err) {
                    log.error('DBManager: Failed to create INDEX=[%s] ERROR=%s', JSON.stringify(procedure), err.stack);
                    return Q.reject(err);
                })
                .then(function(result) {
                    log.silly('DBManager: Attempted to create INDEX=[%s] RESULT=[%s]', JSON.stringify(procedure), util.inspect(result));
                    return result;
                });
            });
            return Q.allSettled(tasks);
        });
    }

    /**
     * Sorts through all created indices and drops any index not declared in config
     * @method dropUnconfiguredIndices
     * @param {Array} procedures
     * @return {Promise}
     */
    static dropUnconfiguredIndices (procedures) {
        return DbManager.getStoredIndices().catch(function(err) {
            return Q.reject(new Error('DBManager: Failed to get stored indices ERROR=' + err.stack));
        }).then(function(storedIndices) {

            var tasks = storedIndices.map(function(index) {

                //special condition: When mongo is used as the media
                //storage provider two special collections are created:
                //"fs.chunks" and "fs.files".  These indices should be
                //left alone and ignored.
                if (DbManager.isProtectedIndex(index.ns)) {
                    log.silly("DBManager: Skipping protected index for %s", index.ns);
                    return Q.resolve();
                }

                var filteredIndex = procedures.filter(function (procedure) {
                    var ns = Configuration.active.db.name + '.' + procedure.collection;
                    return ns === index.ns && DbManager.compareIndices(index, procedure);
                });
                var indexCollection = index.ns.split('.')[1];

                //ignore any index relating to the "_id" field.
                //ignore all indices of the "session" collection as it is managed elsewhere.
                //use length and null/undefined check for if the index in question is defined in config.indices.
                if (index.name === '_id_' || indexCollection === 'session' || (filteredIndex.length !== 0 && !_.isNil(filteredIndex))) {
                    return Q.resolve();
                }

                return DbManager.getDb().then(function (db) {
                    return IndexService.dropIndex(db, indexCollection, index.name).catch(function (err) {
                        log.error('DBManager: Failed to drop undeclared INDEX=[%s] ERROR[%s]', JSON.stringify(index), err.stack);
                        return Q.reject(err);
                    });
                });
            });
            return Promise.all(tasks);
        });
    }

    /**
     * Compares an index stored in Mongo to an index declared in config
     * @param {Object} stored
     * @param {Object} defined
     * @return {boolean}
     */
    static compareIndices (stored, defined) {
        var keys = Object.keys(stored.key);
        var specs = Object.keys(defined.spec);
        return  JSON.stringify(keys) === JSON.stringify(specs);
    }

    /**
     * Yields all indices currently in the entire database
     * @return {Promise}
     */
    static getStoredIndices () {
        return DbManager.getDb().then(function(db) {
            return db.collections();
        }).then(function(collections) {
            var tasks = collections.map(function(collection) {
                return collection.indexes();
            });
            return Promise.all(tasks);
        }).then(function(indexArrays) {
            return Array.prototype.concat.apply([], indexArrays);
        });
    }

    static processMigration (cb) {
        //TODO [1.0] understand the problem that is created when this is added as a dependency.
        //I think it is circular with DAO
        var DBMigrate = require('./db_migrate.js');
        new DBMigrate().run(cb);
    }

    /**
     * Iterates over all database handles and call's their shutdown function.
     * @param {Function} cb Callback function
     * @return {Promise} Fulfills Array of objects, one for each db connection that was closed
     */
    static shutdown () {

        var tasks = Object.keys(dbs).map(function(key) {
            return dbs[key].close(true);
        });
        return Q.allSettled(tasks);
    }

    /**
     * Initializes the DB manager by registering a shutdown hook
     */
    static init () {
        System.registerShutdownHook('DbManager', DbManager.shutdown);
    }

    /**
     * The protocol prefix for connecting to a mongo cluster
     * @readonly
     * @type {string}
     */
    static get PROTOCOL_PREFIX () {
        return 'mongodb://';
    }

    /**
     *
     * @param {Object} config
     * @param {Array} config.servers
     * @param {String} config.name
     * @return {String}
     */
    static buildConnectionStr (config) {
        var str = DbManager.PROTOCOL_PREFIX;
        var options = '?';
        for (var i = 0; i < config.db.servers.length; i++) {

            //check for prefix for backward compatibility
            var hostAndPort = config.db.servers[i];
            if (hostAndPort.indexOf(DbManager.PROTOCOL_PREFIX) === 0) {
                hostAndPort = hostAndPort.substring(DbManager.PROTOCOL_PREFIX.length);
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
        }
        return UrlUtils.urlJoin(str, config.db.name) + options;
    }

    /**
     *
     * @param {String} indexNamespace
     * @return {Boolean}
     */
    static isProtectedIndex (indexNamespace) {
        return indexNamespace.indexOf(DbManager.FILES_NAMESPACE, indexNamespace.length - DbManager.FILES_NAMESPACE.length) !== -1 ||
            indexNamespace.indexOf(DbManager.CHUNKS_NAMESPACE, indexNamespace.length - DbManager.CHUNKS_NAMESPACE.length) !== -1 ||
            indexNamespace.indexOf(DbManager.SYSTEM_NAMESPACE_PREFIX) !== -1;
    }
}

//exports
module.exports = DbManager;
