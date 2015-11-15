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

//dependencies
var ObjectID = require('mongodb').ObjectID;
var util     = require('../util.js');

module.exports = function DAOModule(pb) {

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
        this.dbName = util.isNullOrUndefined(dbName) ? pb.config.db.name : dbName;
    }

    /**
     * Static variable to indicate that all indices of a document should be
     * retrieved
     *
     * @property PROJECT_ALL
     * @type {Object}
     */
    DAO.PROJECT_ALL = Object.freeze({});

    /**
     * Static variable to indicate that documents should be retrieve from anywhere
     *
     * @property ANYWHERE
     * @type {Object}
     */
    DAO.ANYWHERE = Object.freeze({});

    /**
     * Static variable to indicate that documents should be returned in their
     * natural order
     *
     * @property NATURAL_ORDER
     * @type {Array}
     */
    DAO.NATURAL_ORDER = Object.freeze([]);

    /**
     * Static varible to sort ascending
     *
     * @property ASC
     * @type {Number}
     */
    DAO.ASC = 1;

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
     * @param {Object}   Key value pair object to exclude the retrival of data
     * @param {Function} cb         Callback function
     */
    DAO.prototype.loadById = function(id, collection, opts, cb){
        this.loadByValues(DAO.getIdWhere(id), collection, opts, cb);
    };

    /**
     * Retrieves objects matching a key value pair
     *
     * @method loadByValue
     * @param {String}   key        The key to search for
     * @param {*}        val        The value to search for
     * @param {String}   collection The collection to search in
     * @param {Object}   opts Key value pair object to exclude the retrival of data
     * @param {Function} cb         Callback function
     */
    DAO.prototype.loadByValue = function(key, val, collection, opts, cb) {
        var where = {};
        where[key] = val;
        this.loadByValues(where, collection, opts, cb);
    };

    /**
     * Retrieves object matching several key value pairs
     *
     * @method loadByValues
     * @param {Object}   where      Key value pair object
     * @param {String}   collection The collection to search in
     * @param {Object}   opts Key value pair object to exclude the retrival of data
     * @param {Function} cb         Callback function
     */
    DAO.prototype.loadByValues = function(where, collection, opts, cb) {
        if (util.isFunction(opts)) {
            cb = opts;
            opts = null;
        }
        if (!util.isObject(opts)) {
            opts = { };
        }

        var options = {
            where: where,
            select: opts.select || DAO.PROJECT_ALL,
            order: opts.order || DAO.NATURAL_ORDER,
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
        var options = {
            count: true,
            entityType: entityType,
            where: where
        };
        this._doQuery(options, function(err, cursor) {
            if (util.isError(err)) {
                return cb(err);
            }
            cursor.count(cb);
        });
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
        if (util.isFunction(exclusionId)) {
            cb          = exclusionId;
            exclusionId = null;
        }

        //validate parameters
        if (!util.isObject(where) || !util.isString(collection)) {
            return cb(new Error("The collection and where parameters are required"));
        }

        //set the exclusion
        if (exclusionId) {
            where[DAO.getIdField()] = DAO.getNotIdField(exclusionId);
        }

        //checks to see how many docs were available
        this.count(collection, where, function(err, count) {
            cb(err, count === 0);
        });
    };

    /**
     * Queries the database. Added in the 0.2.5 release
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
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        else if (!util.isObject(options)) {
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
        this._doQuery(opts, function(err, cursor) {
            if (util.isError(err)) {
                return cb(err);
            }

            //handle cursor
            var handler = util.isFunction(options.handler) ? options.handler : self.toArrayCursorHandler;
            handler(cursor, function(err, docs) {

                //close the cursor
                cursor.close(function(err){
                    if (util.isError(err)) {
                        pb.log.error("DAO: An error occurred while attempting to close the cursor. %s", err.stack);
                    }
                });

                //callback with results
                cb(err, docs);
            });
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
     * @param {Array} [order] The ordering
     * @param {Array} [orderBy] The ordering. Parameter orderBy is deprecated, use order instead.
     * @param {Integer} [limit] The maximum number of results to return
     * @param {Integer} [offset] The number of results to skip before returning results.
     * @return {Cursor} The MongoDB cursor that provides the results of the query
     */
    DAO.prototype._doQuery = function(options, cb) {
        if (!util.isString(options.entityType)) {
            return cb(Error('An entity type must be specified!'));
        }

        //set defaults
        var entityType = options.entityType;
        var where      = options.where  ? options.where : DAO.ANYWHERE;
        var select     = options.select ? options.select : DAO.PROJECT_ALL;
        var offset     = options.offset ? options.offset : 0;

        //get reference to the db
        var self = this;
        this.getDb(function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }

            //assemble the query
            var cursor = db.collection(options.entityType)
                .find(where, select)
                .skip(offset);

            //apply sort order
            var orderBy = options.order || options.orderBy;
            if (orderBy) {
                cursor.sort(orderBy);
            }

            //apply maximum number of results to return
            if (options.limit) {
                cursor.limit(options.limit);
            }

            //log the result
            if(pb.config.db.query_logging){
                var query = "DAO: %s %j FROM %s.%s WHERE %j";
                var args = [options.count ? 'COUNT' : 'SELECT', select, self.dbName, entityType, where];
                if (typeof orderBy !== 'undefined') {
                    query += " ORDER BY %j";
                    args.push(orderBy);
                }
                if (typeof options.limit !== 'undefined') {
                    query += " LIMIT %d, OFFSET %d";
                    args.push(options.limit, offset);
                }
                args.unshift(query);
                pb.log.info(util.format.apply(util, args));
            }
            cb(null, cursor);
        });
    };

    /**
     * Retrieves a refernce to the DB with active connection
     * @method getDb
     * @param {Function} cb
     */
    DAO.prototype.getDb = function(cb) {
        pb.dbm.getDb(this.dbName, cb);
    };

    /**
     * Inserts or replaces an existing document with the specified DB Object.
     * An insert is distinguished from an update based the presence of the _id
     * field.
     * @method save
     * @param {Object} dbObj The system object to persist
     * @param {Object} [options] See http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#save
     * @param {Function} cb A callback that takes two parameters.  The first, an
     * error, if occurred.  The second is the object that was persisted
     */
    DAO.prototype.save = function(dbObj, options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        else if (!util.isObject(options)) {
            return cb(new Error('OPTIONS_PARAM_MUST_BE_OBJECT'));
        }
        if (!util.isObject(dbObj)) {
            return cb(new Error('The dbObj parameter must be an object'));
        }

        //ensure an object_type was specified & update common fields
        dbObj.object_type = dbObj.object_type || options.object_type;
        DAO.updateChangeHistory(dbObj);

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

        //retrieve db reference
        this.getDb(function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }

            //execute persistence operation
            db.collection(dbObj.object_type).save(dbObj, options, function(err/*, writeOpResult*/) {
                cb(err, dbObj);
            });
        });
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
        if (util.isFunction(options)) {
            cb      = options;
            options = {
                useLegacyOps: true
            };
        }
        else if (!util.isObject(options)) {
            return cb(new Error('OPTIONS_PARAM_MUST_BE_OBJECT'));
        }
        if (!util.isArray(objArray)) {
            return cb(new Error('The objArray parameter must be an Array'));
        }
        else if (!util.isString(collection)) {
            return cb(new Error('COLLECTION_MUST_BE_STR'));
        }

        //retrieve db reference
        this.getDb(function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }

            //initialize the batch operation
            var col = db.collection(collection);
            var batch = col.initializeUnorderedBulkOp(options);

            //build the batch
            objArray.forEach(function(item) {

                item.object_type = collection;
                DAO.updateChangeHistory(item);
                if (item._id) {
                    batch.update(item);
                }
                else {
                    batch.insert(item);
                }
            });
            batch.execute(cb);
        });
    };

    /**
     * Updates a specific set of fields. This is handy for performing upserts.
     * @method updateFields
     * @param {String} collection The collection to update object(s) in
     * @param {Object} query The where clause to execute to find the existing object
     * @param {Object} updates The updates to perform
     * @param {Object} options Any options to go along with the update
     * @param {Boolean} [options.upsert=false] Inserts the object is not found
     * @param {Boolean} [options.multi=false] Updates multiple records if the query
     * finds more than 1
     * @param {Function} cb
     */
    DAO.prototype.updateFields = function(collection, query, updates, options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }

        if (pb.config.db.query_logging) {
            pb.log.info('UPDATE %s.%s %s WHERE %s WITH OPTIONS %s', this.dbName, collection, JSON.stringify(updates), JSON.stringify(query), JSON.stringify(options));
        }
        this.getDb(function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }

            //execute update
            db.collection(collection).update(query, updates, options, cb);
        });
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
        if (!pb.validation.isId(oid)) {
            return cb(new Error('An id must be specified in order to delete'));
        }

        var where = DAO.getIdWhere(oid);
        this.delete(where, collection, cb);
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
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }
        else if (!util.isObject(options)) {
            return cb(new Error('OPTIONS_PARAM_MUST_BE_OBJECT'));
        }

        //require param error checking
        if (!util.isObject(where)) {
            return cb(new Error('WHERE_CLAUSE_MUST_BE_OBJECT'));
        }
        else if (!util.isString(collection)) {
            return cb(new Error('COLLECTION_MUST_BE_STR'));
        }

        //log interaction
        if(pb.config.db.query_logging){
            pb.log.info('DAO: DELETE FROM %s.%s WHERE %s', this.dbName, collection, JSON.stringify(where));
        }

        //execute delete command
        pb.dbm.getDb(this.dbName, function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }
            db.collection(collection).remove(where, options, cb);
        });
    };

    /**
     * Sends a command to the DB.
     * http://mongodb.github.io/node-mongodb-native/api-generated/db.html#command
     * @method command
     * @param {Object} The command to execute
     * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
     */
    DAO.prototype.command = function(command, cb) {
        if (!util.isObject(command)) {
            cb(new Error('COMMAND_MUST_BE_OBJECT'));
            return;
        }

        //execute command
        pb.dbm.getDb(this.dbName, function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }
            db.command(command, cb);
        });
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
        if (!util.isObject(procedure)) {
            cb(new Error('PROCEDURE_MUST_BE_OBJECT'));
            return;
        }

        //extract needed values
        var collection = procedure.collection;
        var spec       = procedure.spec;
        var options    = procedure.options || {};

        //execute command
        pb.dbm.getDb(this.dbName, function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }
            db.collection(collection).ensureIndex(spec, options, cb);
        });
    };

    /**
     * Retrieves indexes for the specified collection
     * @method indexInfo
     * @param {String} collection
     * @param {Object} [options={}]
     * @param {Function} cb
     */
    DAO.prototype.indexInfo = function(collection, options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }
        pb.dbm.getDb(this.dbName, function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }

            db.indexInformation(collection, options, cb);
        });
    };

    /**
     * Drops the specified index from the given collection
     * @method dropIndex
     * @param {String} collection
     * @param {String} indexName
     * @param {Object} [options={}]
     * @param {Function} cb
     */
    DAO.prototype.dropIndex = function(collection, indexName, options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }

        pb.dbm.getDb(this.dbName, function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }
            db.collection(collection).dropIndex(indexName, options, cb);
        });
    };

    /**
     * Determines if a collection exists in the DB
     * @method entityExists
     * @param {String} entity The name of the collection
     * @param {Function} cb A callback that takes two parameters. The first, an
     * error, if occurred. The second is a boolean where TRUE means the entity
     * exists, FALSE if not.
     */
    DAO.prototype.entityExists = function(entity, cb) {
        this.listCollections({name: entity}, function(err, results) {
            cb(err, util.isArray(results) && results.length === 1);
        });
    };

    /**
     * Creates a collection in the DB
     * @method createEntity
     * @param {String} entityName
     * @param {Object} [options] The options for the collection. See
     * http://mongodb.github.io/node-mongodb-native/api-generated/db.html#createcollection
     * @param {Function} cb A callback that takes two parameters. The first, an
     * Error, if occurred. The second is the result of the creation command.
     */
    DAO.prototype.createEntity = function(entityName, options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        else if (!util.isObject(options)) {
            return cb(new Error('OPTIONS_PARAM_MUST_BE_OBJECT'));
        }

        pb.dbm.getDb(this.dbName, function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }
            db.createCollection(entityName, options, cb);
        });
    };

    /**
     * Gets all collection names
     * @method listCollections
     * @param {Object} [filter] The filter to specify what collection(s) to search for
     * @param {Function} cb A callback that takes two parameters. The first, an
     * Error, if occurred. The second is the result listCollections command.
     */
    DAO.prototype.listCollections = function(filter, cb) {
        var options = {
          namesOnly: true
        };

        pb.dbm.getDb(this.dbName, function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }
            db.listCollections(filter, options).toArray(function(err, results) {
                if (util.isError(err)) {
                    return cb(err)
                }
                cb(err, results);
            });
        });
    };

    /**
     * Creates a basic where clause based on the specified Id
     * @deprecated since 0.4.0
     * @static
     * @method getIDWhere
     * @param {String} oid Object Id String
     * @return {Object}    Where clause
     */
    DAO.getIDWhere = function(oid){
        pb.log.warn('DAO: getIDWhere is deprecated.  Use getIdWhere instead');
        return DAO.getIdWhere(oid);
    };

    /**
     * Creates a basic where clause based on the specified Id
     * @static
     * @method getIdWhere
     * @param {String} oid Object Id String
     * @return {Object} Where clause
     */
    DAO.getIdWhere = function(oid) {
        return {
            _id: DAO.getObjectId(oid)
        };
    };

    /**
     * Creates a where clause that equates to select where [idProp] is in the
     * specified array of values.
     * @static
     * @method getIDInWhere
     * @param {Array} objArray The array of acceptable values
     * @param {String} idProp The property that holds a referenced ID value
     * @return {Object} Where clause
     */
    DAO.getIDInWhere = function(objArray, idProp) {
        pb.log.warn('DAO: getIDInWhere is deprecated. Use getIdInWhere instead');
        return DAO.getIdInWhere(objArray, idProp);
    };

    /**
     * Creates a where clause that equates to select where [idProp] is in the
     * specified array of values.
     * @static
     * @method getIdInWhere
     * @param {Array} objArray The array of acceptable values
     * @param {String} idProp The property that holds a referenced ID value
     * @return {Object} Where clause
     */
    DAO.getIdInWhere = function(objArray, idProp) {
        var seen = {};
        var idArray = [];
        for(var i = 0; i < objArray.length; i++) {

            var rawId;
            if (idProp) {
                rawId = objArray[i][idProp];
            }
            else{
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
    };

    /**
     * Creates a where clause that equates to select where [idProp] is not in the
     * specified array of values.
     * @static
     * @method getIDInWhere
     * @param {Array} objArray The array of acceptable values
     * @param {String} idProp The property that holds a referenced ID value
     * @return {Object} Where clause
     */
    DAO.getIdNotInWhere = function(objArray, idProp) {
        var idArray = [];
        for(var i = 0; i < objArray.length; i++) {

            var rawId;
            if (idProp) {
                rawId = objArray[i][idProp];
            }
            else{
                rawId = objArray[i];
            }
            idArray.push(DAO.getObjectId(rawId));
        }
        return {
            _id: {$nin: idArray}
        };
    };

    /**
     * Creates a basic where clause based on not equalling the specified Id
     * @deprecated
     * @static
     * @method getNotIDWhere
     * @param {String} oid Object Id String
     * @return {Object}    Where clause
     */
    DAO.getNotIDWhere = function(oid) {
        pb.log.warn('DAO: getNotIDField is deprecated. Use getNotIdField instead');
        return DAO.getNotIdWhere(oid);
    };

    /**
     * Creates a basic where clause based on not equalling the specified Id
     * @static
     * @method getNotIdWhere
     * @param {String} oid Object Id String
     * @return {Object}    Where clause
     */
    DAO.getNotIdWhere = function(oid) {
        return {
            _id: DAO.getNotIdField(oid)
        };
    };

    /**
     * Creates a where clause that indicates to select where the '_id' field does
     * not equal the specified value.
     * @deprecated since 0.4.0
     * @static
     * @method getNotIDField
     * @return {Object} Where clause
     */
    DAO.getNotIDField = function(oid) {
        pb.log.warn('DAO: getNotIDField is deprecated. Use getNotIdField instead');
        return DAO.getNotIdField(oid);
    };

    /**
     * Creates a where clause that indicates to select where the '_id' field does
     * not equal the specified value.
     * @static
     * @method getNotIdField
     * @return {Object} Where clause
     */
    DAO.getNotIdField = function(oid) {
        return {$ne: DAO.getObjectId(oid)};
    };

    /**
     * Creates an MongoDB ObjectID object
     * @deprecated since 0.4.0
     * @static
     * @method getObjectID
     * @param {String} oid Object Id String
     * @return {Object}    ObjectID object
     */
    DAO.getObjectID = function(oid) {
        pb.log.warn('DAO: getObjectID is deprecated. Use getObjectId instead');
        return DAO.getObjectId(oid);
    };

    /**
     * Creates an MongoDB ObjectID object
     * @static
     * @method getObjectId
     * @param {String} oid Object Id String
     * @return {Object}    ObjectID object
     */
    DAO.getObjectId = function(oid) {
        try {
           return new ObjectID(oid + '');
        }
        catch(err) {
            return oid;
        }
    };

    /**
     * Updates a DB object with a created time stamp and last modified time stamp.
     * @static
     * @method updateChangeHistory
     * @param {Object} dbObject Object to update
     */
    DAO.updateChangeHistory = function(dbObject){
        if (util.isNullOrUndefined(dbObject)) {
            throw new Error("The dbObject parameter is required");
        }

        var now = new Date();
        if (util.isNullOrUndefined(dbObject._id)) {
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
        if (!util.isObject(obj) || !util.isString(to)) {
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

    /**
     * Determines if two object IDs are equal
     * @static
     * @method areIdsEqual
     * @param {ObjectID|String} id1
     * @param {ObjectID|String} id2
     * @return {Boolean} TRUE if IDs are equal
     */
    DAO.areIdsEqual = function(id1, id2) {
        return id1.toString() === id2.toString();
    };

    //exports
    return DAO;
}
