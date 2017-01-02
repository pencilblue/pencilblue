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
var Q = require('q');

/**
 * Provides functionality to interact with DB indexes
 */
class IndexService {

    /**
     * Attempts to create an index.  If the collection already exists then the
     * operation is skipped.
     * http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#ensureindex
     * @param {Db} db
     * @param {Object} procedure The objects containing the necessary parameters
     * and options to create the index.
     *  @param {String} procedure.collection The collection to build an index for
     *  @param {Object} procedure.spec An object that specifies one or more fields
     * and sort direction for the index.
     *  @param {Object} [procedure.options={}] An optional parameter that can
     * specify the options for the index.
     * @return {Promise}
     */
    static ensureIndex  (db, procedure) {
        if (!_.isObject(procedure)) {
            return Q.reject(new Error('PROCEDURE_MUST_BE_OBJECT'));
        }

        //extract needed values
        var collection = procedure.collection;
        var spec       = procedure.spec;
        var options    = procedure.options || {};

        //execute command
        return db.collection(collection).ensureIndex(spec, options);
    }

    /**
     * Drops the specified index from the given collection
     * @param {String} collection
     * @param {String} indexName
     * @param {Object} [options={}]
     * @param {Function} cb
     */
    static dropIndex (db, collection, indexName, options) {
        options = options || {};

        return db.collection(collection)
            .dropIndex(indexName, options);
    }
}

module.exports = IndexService;
