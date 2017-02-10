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
var CacheFactory = require('../../dao/cache');
var Configuration = require('../../config');
var log = require ('../../utils/logging').newInstance('RedisRegistrationProvider');
var DateUtils = require('../../../lib/utils/dateUtils');

/**
 * The Redis client used to connect to the service registry
 * @private
 * @static
 * @readonly
 * @property CLIENT
 * @type {Integer}
 */
var CLIENT = null;

/**
 * Implements the necessary functions in order to be able to create and manage
 * a service registry for PB processes in the cluster.  This provider uses Redis
 * as the storage.  In addition, it leverages Redis's expiry functionality to
 * expire entries automatically if they have not been touched.  In order to
 * retrieve all nodes/processes in the cluster the provider must execute
 * Redis's "keys" function which is an expensive operation.  To lessen the
 * impact on production systems the provider creates and manages its own Redis
 * client and switches to DB 2 in order to minimize the number of keys that
 * need to be scanned since the rest of the PB system leverages DB 0.
 * @class RedisRegistrationProvider
 * @constructor
 */
class RedisRegistrationProvider {

    /**
     * The Redis DB used for storage
     * @private
     * @static
     * @readonly
     * @property REGISTRY_DB
     * @type {Integer}
     */
    static get REGISTRY_DB() {
        return 0;
    }

    /**
     * The character used to separate the registry key prefix from the unique value
     * that identifies the process/node.
     * @private
     * @static
     * @readonly
     * @property SEP
     * @type {String}
     */
    static get SEP() {
        return '-';
    }

    /**
     * Retrieves the entire cluster status as an array of status objects.  The '_id'
     * property uniquely identifies each process/node.
     * @method get
     * @param {Function} cb A callback that provides two parameters: cb(Error, Array)
     */
    get(cb) {

        var pattern = RedisRegistrationProvider.getPattern();
        CLIENT.keys(pattern, function (err, keys) {
            if (_.isError(err)) {
                cb(err);
                return;
            }

            CLIENT.mget(keys, function (err, statusObj) {

                //do data transform
                var statuses = [];
                if (_.isObject(statusObj)) {
                    statuses = Object.keys(statusObj).map(function(key) {
                        try {
                            var status = JSON.parse(statusObj[key]);
                            status._id = status.id || key;
                            statuses.push(status);
                        }
                        catch (e) {
                        }
                    });
                }
                cb(err, statuses);
            });
        });
    }

    /**
     * Updates the status of a single node.
     * @method set
     * @param {String} id The unique identifier for the process/node
     * @param {Object} status The status information
     * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
     */
    set(id, status, cb) {
        if (!_.isObject(status)) {
            return cb(new Error('The status parameter must be a valid object'));
        }

        var key = RedisRegistrationProvider.getKey(id);
        var expiry = Math.floor(Configuration.active.registry.update_interval / DateUtils.MILLIS_PER_SEC);
        CLIENT.setex(key, expiry, JSON.stringify(status), cb);
    }

    /**
     * Purges all statuses from storage.
     * @method flush
     * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
     */
    flush(cb) {
        var pattern = RedisRegistrationProvider.getPattern();
        CLIENT.keys(pattern, function (err, keys) {
            if (_.isError(err)) {
                return cb(err);
            }

            CLIENT.del(keys, cb);
        });
    }

    /**
     * This function should only be called once at startup.  It is responsible for
     * creating the Redis client that connects to the service registry.  It also
     * ensures the proper Redis DB is selected.
     * @method init
     * @param {Function} cb A callback that takes two parameters. cb(Error, [RESULT])
     */
    init(cb) {

        CLIENT = CacheFactory.createInstance();
        CLIENT.select(RedisRegistrationProvider.REGISTRY_DB, cb);
    }

    /**
     * Should be called during shutdown.  It is responsible for removing the
     * process/node from the registry.
     * @method shutdown
     * @param {String} id The unique identifier for the node/process
     * @param {Function} cb A callback that takes two parameters: cb(Error, [RESULT])
     */
    shutdown(id, cb) {
        if (!id) {
            log.error('RedisRegistrationProvider: A valid ID is needed in order to properly shutdown');
            cb(null, false);
        }

        var key = RedisRegistrationProvider.getKey(id);
        CLIENT.del(key, cb);
    }

    /**
     * Creates the cache key used to store the status update
     * @static
     * @method getKey
     * @param {String} id The unique identifier for the node/process
     * @return {String} The cache key to be used for storing the update
     */
    static getKey(id) {
        return [Configuration.active.registry.key, id].join(RedisRegistrationProvider.SEP);
    }

    /**
     * Creates the glob pattern to be used to find service registry keys
     * @static
     * @method getPattern
     * @return {String} The glob patern to be used to find all status updates
     */
    static getPattern() {
        return Configuration.active.registry.key + '*';
    }
}

module.exports = RedisRegistrationProvider;
