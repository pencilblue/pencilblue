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

//dependencies
var _ = require('lodash');
var Configuration = require('../config');
var DbManager = require('./db_manager');
var log = require('../utils/logging').newInstance('DAO');
var ObjectID = require('mongodb').ObjectID;
var util = require('util');

/**
 * Controls the data model
 * @param {String} [dbName] Will default to the config.db.name DB when not
 * provided.
 */
class DAO {
    constructor(dbName) {

        /**
         * The name of the DB that this instance is intended to interact with.  By
         * default, it goes to the name of the DB provided by system configuration
         * property db.name.
         * @property dbName
         * @type {String}
         */
        this.dbName = dbName || Configuration.active.db.name;
    }

    /**
     * Static variable to indicate that all indices of a document should be
     * retrieved
     * @property PROJECT_ALL
     * @type {Object}
     */
    static get PROJECT_ALL() {
        return Object.freeze({});
    }

    /**
     * Static variable to indicate that documents should be retrieve from anywhere
     * @property ANYWHERE
     * @type {Object}
     */
    static get ANYWHERE() {
        return Object.freeze({});
    }

    /**
     * Static variable to indicate that documents should be returned in their
     * natural order
     * @property NATURAL_ORDER
     * @type {Array}
     */
    static get NATURAL_ORDER() {
        return Object.freeze([]);
    }

    /**
     * Static varible to sort ascending
     * @property ASC
     * @type {Number}
     */
    static get ASC() {
        return 1;
    }

    /**
     * Static variable to sort descending
     * @property DESC
     * @type {Number}
     */
    static get DESC() {
        return -1;
    }

    /**
     * Retrieves an object by ID
     * @param {String}   id         The unique id of the object
     * @param {String}   collection The collection the object is in
     * @param {Object}   Key value pair object to exclude the retrival of data
     * @param {Function} cb         Callback function
     */
    loadById(id, collection, opts, cb) {
        this.loadByValues(DAO.getIdWhere(id), collection, opts, cb);
    }

    /**
     * Retrieves objects matching a key value pair
     * @param {String}   key        The key to search for
     * @param {*}        val        The value to search for
     * @param {String}   collection The collection to search in
     * @param {Object}   [opts] Key value pair object to exclude the retrieval of data
     * @param {Function} cb         Callback function
     */
    loadByValue(key, val, collection, opts, cb) {
        var where = {};
        where[key] = val;
        this.loadByValues(where, collection, opts, cb);
    }

    /**
     * Retrieves object matching several key value pairs
     * @param {Object}   where      Key value pair object
     * @param {String}   collection The collection to search in
     * @param {Object}   [opts] Key value pair object to exclude the retrieval of data
     * @param {Function} cb         Callback function
     */
    loadByValues(where, collection, opts, cb) {
        if (typeof opts === 'function') {
            cb = opts;
            opts = null;
        }
        if (typeof opts !== 'object') {
            opts = {};
        }

        var options = {
            where: where,
            select: opts.select || DAO.PROJECT_ALL,
            order: opts.order || DAO.NATURAL_ORDER,
            limit: 1
        };

        this.q(collection, options, function (err, result) {
            cb(err, Array.isArray(result) && result.length > 0 ? result[0] : null);
        });
    }

    /**
     * Gets the count of objects matching criteria
     * @param  {String}   entityType The type of object to search for
     * @param  {Object}   where      Key value pair object
     * @param  {Function} cb         Callback function
     */
    count(entityType, where, cb) {
        var options = {
            count: true,
            entityType: entityType,
            where: where
        };
        this._doQuery(options, function (err, cursor) {
            if (_.isError(err)) {
                return cb(err);
            }
            cursor.count(cb);
        });
    }

    /**
     * Determines if an object extists matching criteria
     * @param  {String}   collection The collection to search in
     * @param  {Object}   where      Key value pair object
     * @param  {Function} cb         Callback function
     */
    exists(collection, where, cb) {
        this.count(collection, where, function (err, count) {
            cb(err, count > 0);
        });
    }

    /**
     * Determines if there is only a single document that matches the specified query
     * @param  {String}   collection    The collection to search in
     * @param  {Object}   where         Key value pair object
     * @param  {String}   [exclusionId] Object Id to exclude from the search
     * @param  {Function} cb            Callback function
     */
    unique(collection, where, exclusionId, cb) {
        if (typeof exclusionId === 'function') {
            cb = exclusionId;
            exclusionId = null;
        }

        //validate parameters
        if (typeof where !== 'object' || typeof collection !== 'string') {
            return cb(new Error("The collection and where parameters are required"));
        }

        //set the exclusion
        if (exclusionId) {
            where[DAO.getIdField()] = DAO.getNotIdField(exclusionId);
        }
        //checks to see how many docs were available
        this.count(collection, where, function (err, count) {
            cb(err, count === 0);
        });
    }

    /**
     * Queries the database. Added in the 0.2.5 release
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
    q(collection, options, cb) {
        if (typeof options === 'function') {
            cb = options;
            options = {};
        }
        else if (!_.isObject(options)) {
            return cb(new Error('OPTIONS_PARAM_MUST_BE_OBJECT'));
        }

        //execute the query
        var self = this;
        var opts = {
            entityType: collection,
            where: options.where,
            select: options.select,
            order: options.order,
            limit: options.limit,
            offset: options.offset
        };
        this._doQuery(opts, function (err, cursor) {
            if (_.isError(err)) {
                return cb(err);
            }

            //handle cursor
            var handler = _.isFunction(options.handler) ? options.handler : self.toArrayCursorHandler;
            handler(cursor, function (err, docs) {

                //close the cursor
                cursor.close(function (err) {
                    if (_.isError(err)) {
                        log.error("An error occurred while attempting to close the cursor. %s", err.stack);
                    }
                });

                //callback with results
                cb(err, docs);
            });
        });
    }

    /**
     * A cursor handler that iterates over each result from the query that created
     * the cursor and places the result into an array.  The array of documents is
     * provided as the second argument in the callback.
     * @param {Cursor} cursor
     * @param {Function} cb
     */
    toArrayCursorHandler(cursor, cb) {
        cursor.toArray(cb);
    }

    /**
     * The actual implementation for querying.  The function does not do the same
     * type checking as the wrapper function "query".  This funciton is responsible
     * for doing the heavy lifting and returning the result back to the calling intity.
     * @protected
     * @param {object} options
     * @param {String} options.entityType The collection to query
     * @param {Object} [options.where={}] The where clause
     * @param {Object} [options.select={}] The fields to project
     * @param {Array} [options.order] The ordering
     * @param {Integer} [options.limit] The maximum number of results to return
     * @param {Integer} [offset] The number of results to skip before returning results.
     * @param {function} The MongoDB cursor that provides the results of the query
     */
    _doQuery(options, cb) {
        if (!_.isString(options.entityType)) {
            return cb(Error('An entity type must be specified!'));
        }

        //set defaults
        var entityType = options.entityType;
        var where = options.where ? options.where : DAO.ANYWHERE;
        var select = options.select ? options.select : DAO.PROJECT_ALL;
        var offset = options.offset ? options.offset : 0;

        //get reference to the db
        var self = this;
        this.getDb(function (err, db) {
            if (_.isError(err)) {
                return cb(err);
            }

            //assemble the query
            var cursor = db.collection(options.entityType)
                .find(where, select)
                .skip(offset);

            //apply sort order
            var orderBy = options.order;
            if (orderBy) {
                cursor.sort(orderBy);
            }

            //apply maximum number of results to return
            if (options.limit) {
                cursor.limit(options.limit);
            }

            //ensure that an "id" value is provided
            if (!options.count) {
                cursor.map(DAO.mapSimpleIdField);
            }

            //log the result
            if (Configuration.active.db.query_logging) {
                var query = "%s %j FROM %s.%s WHERE %s";
                var args = [options.count ? 'COUNT' : 'SELECT', select, self.dbName, entityType, util.inspect(where, {breakLength: Infinity})];
                if (typeof orderBy !== 'undefined') {
                    query += " ORDER BY %j";
                    args.push(orderBy);
                }
                if (typeof options.limit !== 'undefined') {
                    query += " LIMIT %d, OFFSET %d";
                    args.push(options.limit, offset);
                }
                args.unshift(query);
                log.info(util.format.apply(util, args));
            }
            cb(null, cursor);
        });
    }

    /**
     * Retrieves a reference to the DB with active connection
     * @param {Function} cb
     */
    getDb(cb) {
        DbManager.getDb(this.dbName, cb);
    }

    /**
     * Inserts or replaces an existing document with the specified DB Object.
     * An insert is distinguished from an update based the presence of the _id
     * field.
     * @param {Object} dbObj The system object to persist
     * @param {Object} [options] See http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#save
     * @param {Function} cb A callback that takes two parameters.  The first, an
     * error, if occurred.  The second is the object that was persisted
     */
    save(dbObj, options, cb) {
        if (_.isFunction(options)) {
            cb = options;
            options = {};
        }
        else if (!_.isObject(options)) {
            return cb(new Error('OPTIONS_PARAM_MUST_BE_OBJECT'));
        }
        if (!_.isObject(dbObj)) {
            return cb(new Error('The dbObj parameter must be an object'));
        }

        //ensure an object_type was specified & update common fields
        dbObj.object_type = dbObj.object_type || options.object_type;
        DAO.updateChangeHistory(dbObj);

        //log interaction
        if (Configuration.active.db.query_logging) {
            var msg;
            if (dbObj._id) {
                msg = util.format('UPDATE %s WHERE ID=%s', dbObj.object_type, dbObj._id);
            }
            else {
                msg = util.format('INSERT INTO %s', dbObj.object_type);
            }
            log.info(msg);
        }

        //retrieve db reference
        this.getDb(function (err, db) {
            if (_.isError(err)) {
                return cb(err);
            }

            //execute persistence operation
            db.collection(dbObj.object_type).save(dbObj, options, function (err/*, writeOpResult*/) {
                DAO.mapSimpleIdField(dbObj);
                cb(err, dbObj);
            });
        });
    }

    /**
     * Provides a mechanism to save an array of objects all from the same
     * collection.  The function handles updates and inserts.  The difference is
     * determined by the truth value of the ID field of each object.
     * @param {Array} objArray The array of objects to persist
     * @param {String} collection The collection to persist the objects to
     * @param {Object} [options] See http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#initializeunorderedbulkop
     * @param {Function} cb A callback that takes two arguments.  The first is an
     * error, if occurred. The second is the second parameter of the callback
     * described here: http://mongodb.github.io/node-mongodb-native/api-generated/unordered.html#execute
     */
    saveBatch(objArray, collection, options, cb) {
        if (_.isFunction(options)) {
            cb = options;
        }
        if (!Array.isArray(objArray)) {
            return cb(new Error('The objArray parameter must be an Array'));
        }
        else if (!_.isString(collection)) {
            return cb(new Error('COLLECTION_MUST_BE_STR'));
        }

        //retrieve db reference
        this.getDb(function (err, db) {
            if (_.isError(err)) {
                return cb(err);
            }

            //initialize the batch operation
            var col = db.collection(collection);
            var batch = col.initializeUnorderedBulkOp();

            //build the batch
            objArray.forEach(function (item) {

                item.object_type = collection;
                DAO.updateChangeHistory(item);
                if (item._id) {
                    batch.find(DAO.getIdWhere(item._id)).updateOne({$set: item});
                    delete item._id;
                }
                else {
                    batch.insert(item);
                }
            });
            batch.execute(cb);
        });
    }

    /**
     * Updates a specific set of fields. This is handy for performing upserts.
     * @param {String} collection The collection to update object(s) in
     * @param {Object} query The where clause to execute to find the existing object
     * @param {Object} updates The updates to perform
     * @param {Object} [options] Any options to go along with the update
     * @param {Boolean} [options.upsert=false] Inserts the object is not found
     * @param {Boolean} [options.multi=false] Updates multiple records if the query
     * finds more than 1
     * @param {Function} cb
     */
    updateFields(collection, query, updates, options, cb) {
        if (_.isFunction(options)) {
            cb = options;
            options = {};
        }

        if (Configuration.active.db.query_logging) {
            log.info('UPDATE %s.%s %s WHERE %s WITH OPTIONS %s', this.dbName, collection, JSON.stringify(updates), JSON.stringify(query), JSON.stringify(options));
        }
        this.getDb(function (err, db) {
            if (_.isError(err)) {
                return cb(err);
            }

            //execute update
            db.collection(collection).update(query, updates, options, cb);
        });
    }

    /**
     * Removes an object from persistence
     * @param {String|ObjectID} oid The Id of the object to remove
     * @param {String} collection The collection the object is in
     * @param {Function} [cb] A callback that takes two parameters.  The first is
     * an error, if occurred.  The second is the number of records deleted by the
     * execution of the command.
     * @return {Promise} Promise object iff a callback is not provided
     */
    deleteById(oid, collection, cb) {
        if (!DAO.isId(oid)) {
            return cb(new Error('An id must be specified in order to delete'));
        }

        var where = DAO.getIdWhere(oid);
        this.delete(where, collection, cb);
    }

    /**
     * Removes objects from persistence that match criteria
     * @param {Object} where Key value pair object
     * @param {String} collection The collection to search in
     * @param {Object} [options] See http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#remove
     * @param {Function} cb A callback that provides two parameter. The first is an
     * error, if occurred.  The second is the number of records that were removed
     * from persistence.
     */
    delete(where, collection, options, cb) {
        if (_.isFunction(options)) {
            cb = options;
            options = {};
        }
        else if (!_.isObject(options)) {
            return cb(new Error('OPTIONS_PARAM_MUST_BE_OBJECT'));
        }

        //require param error checking
        if (!_.isObject(where)) {
            return cb(new Error('WHERE_CLAUSE_MUST_BE_OBJECT'));
        }
        else if (!_.isString(collection)) {
            return cb(new Error('COLLECTION_MUST_BE_STR'));
        }

        //log interaction
        if (Configuration.active.db.query_logging) {
            log.info('DELETE FROM %s.%s WHERE %s', this.dbName, collection, JSON.stringify(where));
        }

        //execute delete command
        DbManager.getDb(this.dbName, function (err, db) {
            if (_.isError(err)) {
                return cb(err);
            }
            db.collection(collection).remove(where, options, cb);
        });
    }

    /**
     * Sends a command to the DB.
     * http://mongodb.github.io/node-mongodb-native/api-generated/db.html#command
     * @param {Object} command The command to execute
     * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
     */
    command(command, cb) {
        if (!_.isObject(command)) {
            cb(new Error('COMMAND_MUST_BE_OBJECT'));
            return;
        }

        //execute command
        DbManager.getDb(this.dbName, function (err, db) {
            if (_.isError(err)) {
                return cb(err);
            }
            db.command(command, cb);
        });
    }

    /**
     * Retrieves indexes for the specified collection
     * @param {String} collection
     * @param {Object} [options={}]
     * @param {Function} cb
     */
    indexInfo(collection, options, cb) {
        if (_.isFunction(options)) {
            cb = options;
            options = {};
        }
        DbManager.getDb(this.dbName, function (err, db) {
            if (_.isError(err)) {
                return cb(err);
            }

            db.indexInformation(collection, options, cb);
        });
    }

    /**
     * Determines if a collection exists in the DB
     * @param {String} entity The name of the collection
     * @param {Function} cb A callback that takes two parameters. The first, an
     * error, if occurred. The second is a boolean where TRUE means the entity
     * exists, FALSE if not.
     */
    entityExists(entity, cb) {
        this.listCollections({name: entity}, function (err, results) {
            cb(err, Array.isArray(results) && results.length === 1);
        });
    }

    /**
     * Creates a collection in the DB
     * @param {String} entityName
     * @param {Object} [options] The options for the collection. See
     * http://mongodb.github.io/node-mongodb-native/api-generated/db.html#createcollection
     * @param {Function} cb A callback that takes two parameters. The first, an
     * Error, if occurred. The second is the result of the creation command.
     */
    createEntity(entityName, options, cb) {
        if (_.isFunction(options)) {
            cb = options;
            options = {};
        }
        else if (!_.isObject(options)) {
            return cb(new Error('OPTIONS_PARAM_MUST_BE_OBJECT'));
        }

        DbManager.getDb(this.dbName, function (err, db) {
            if (_.isError(err)) {
                return cb(err);
            }
            db.createCollection(entityName, options, cb);
        });
    }

    /**
     * Gets all collection names
     * @param {Object} [filter] The filter to specify what collection(s) to search for
     * @param {Function} cb A callback that takes two parameters. The first, an
     * Error, if occurred. The second is the result listCollections command.
     */
    listCollections(filter, cb) {
        var options = {
            namesOnly: true
        };

        DbManager.getDb(this.dbName, function (err, db) {
            if (_.isError(err)) {
                return cb(err);
            }
            db.listCollections(filter, options).toArray(function (err, results) {
                if (_.isError(err)) {
                    return cb(err);
                }
                cb(err, results);
            });
        });
    }

    /**
     * Creates a basic where clause based on the specified Id
     * @param {String} oid Object Id String
     * @return {Object} Where clause
     */
    static getIdWhere(oid) {
        return {
            _id: DAO.getObjectId(oid)
        };
    }

    /**
     * Creates a where clause that equates to select where [idProp] is in the
     * specified array of values.
     * @param {Array} objArray The array of acceptable values
     * @param {String} [idProp] The property that holds a referenced ID value
     * @return {Object} Where clause
     */
    static getIdInWhere(objArray, idProp) {
        var seen = {};
        var idArray = [];
        for (var i = 0; i < objArray.length; i++) {

            var rawId;
            if (idProp) {
                rawId = objArray[i][idProp];
            }
            else {
                rawId = objArray[i];
            }
            if (!seen[rawId]) {
                seen[rawId] = true;
                idArray.push(DAO.getObjectId(rawId));
            }
        }
        return {
            _id: {$in: idArray}
        };
    }

    /**
     * Creates a where clause that equates to select where [idProp] is not in the
     * specified array of values.
     * @param {Array} objArray The array of acceptable values
     * @param {String} idProp The property that holds a referenced ID value
     * @return {Object} Where clause
     */
    static getIdNotInWhere(objArray, idProp) {
        var idArray = [];
        for (var i = 0; i < objArray.length; i++) {

            var rawId;
            if (idProp) {
                rawId = objArray[i][idProp];
            }
            else {
                rawId = objArray[i];
            }
            idArray.push(DAO.getObjectId(rawId));
        }
        return {
            _id: {$nin: idArray}
        };
    }

    /**
     * Creates a basic where clause based on not equalling the specified Id
     * @param {String} oid Object Id String
     * @return {Object}    Where clause
     */
    static getNotIdWhere(oid) {
        return {
            _id: DAO.getNotIdField(oid)
        };
    }

    /**
     * Creates a where clause that indicates to select where the '_id' field does
     * not equal the specified value.
     * @return {Object} Where clause
     */
    static getNotIdField(oid) {
        return {$ne: DAO.getObjectId(oid)};
    }

    /**
     * Creates an MongoDB ObjectID object
     * @param {String} oid Object Id String
     * @return {Object}    ObjectID object
     */
    static getObjectId(oid) {
        try {
            return new ObjectID(oid + '');
        }
        catch (err) {
            return oid;
        }
    }

    /**
     * Checks to see if the value is a valid ID string or an instance of ObjectID.
     * @param {String|ObjectID} val The value under test
     * @param {Boolean} [required=false] Indicates if the value is required. When
     * FALSE, null will be an acceptable value.
     * @return {Boolean} TRUE if the value is valid, FALSE if not
     */
    static isId(val, required) {
        if (!required && (val === null || val === undefined)) {
            return true;
        }

        var id = DAO.getObjectId(val);
        return id instanceof ObjectID;
    }

    /**
     * Updates a DB object with a created time stamp and last modified time stamp.
     * @param {Object} dbObject Object to update
     */
    static updateChangeHistory(dbObject) {
        if (_.isNil(dbObject)) {
            throw new Error("The dbObject parameter is required");
        }

        var now = new Date();
        if (_.isNil(dbObject._id)) {
            dbObject.created = now;
        }

        //update for current changes
        dbObject.last_modified = now;

        // for the mongo implementation we ensure that the ID is also standardized.  We include the _id but prefer
        // having a standard "id" to keep consistent across all DB platforms that we might support.
        if (dbObject._id) {
            dbObject.id = dbObject._id;
        }
    }

    /**
     * Transfers a system object from one type to another.  The system specific
     * properties are cleared so that when the object is persisted it will receive
     * its own properties.
     * @param {Object} obj The object to convert
     * @param {String} to The type to convert it to
     */
    static transfer(obj, to) {
        if (!_.isObject(obj) || !_.isString(to)) {
            throw new Error('OBJ_TO_PARAMS_MUST_BE');
        }

        delete obj._id;
        delete obj.id;
        delete obj.created;
        delete obj.last_modified;
        obj.object_type = to;
    }

    /**
     * Retrieves the field in system objects that represents the unique identifier.
     * The default implementation returns the mongo field '_id'.
     * @return {String} '_id'
     */
    static getIdField() {
        return '_id';
    }

    /**
     * Determines if two object IDs are equal
     * @param {ObjectID|String} id1
     * @param {ObjectID|String} id2
     * @return {Boolean} TRUE if IDs are equal
     */
    static areIdsEqual(id1, id2) {
        return id1.toString() === id2.toString();
    }

    /**
     * Used to help transition over to eliminating the MongoDB _id field.
     * @param doc
     * @return {object}
     */
    static mapSimpleIdField(doc) {
        if (typeof doc.id === 'undefined') {
            doc.id = doc._id;
        }
        return doc;
    }
}

//exports
module.exports = DAO;
