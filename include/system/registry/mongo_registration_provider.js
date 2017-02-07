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
const _ = require('lodash');
const Configuration = require('../../config');
const DAO = require('../../dao/dao');
const DateUtils = require('../../../lib/utils/dateUtils');
const log = require('../../utils/logging').newInstance('MongoRegistrationProvider');

/**
 * Implements the necessary functions in order to be able to create and manage
 * a service registry for PB processes in the cluster.  This provider uses MongoDB
 * as the storage.  In addition, it leverages MongoDB's TTL collections.  The
 * reaper for mongo runs every 60 seconds.  It is possible for dead processes to
 * appear in the status list for up to that magical 60 second threshold.  The
 * name of the collection used to store all statuses is determined by the
 * configuration property: "registry.key".
 * @class MongoRegistrationProvider
 * @constructor
 */
class MongoRegistrationProvider {

    /**
     * Retrieves the entire cluster status as an array of status objects.  The '_id'
     * property uniquely identifies each process/node.
     * @method get
     * @param {Function} cb A callback that provides two parameters: cb(Error, Array)
     */
    get(cb) {

        var dao = new DAO();
        dao.q(Configuration.active.registry.key, {where: DAO.ANYWHERE}, cb);
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
            cb(new Error('The status parameter must be a valid object'));
            return;
        }

        status[DAO.getIdField()] = id;
        status.object_type = Configuration.active.registry.key;
        var dao = new DAO();
        dao.save(status, cb);
    }

    /**
     * Purges all statuses from storage.
     * @method flush
     * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
     */
    flush(cb) {
        var dao = new DAO();
        dao.delete(DAO.ANYWHERE, Configuration.active.registry.key, cb);
    }

    /**
     * This function should only be called once at startup.  It is responsible for
     * setting up the collection and ensuring that the TTL index is configured
     * correctly based on the the executing processes configuration.  <b>NOTE:</b>
     * The collection only supports one TTL value. The last process to startup and
     * configure the index will win.  Please be careful to ensure that all PB
     * processes/nodes have the same registry.update_interval value.
     * @method init
     * @param {Function} cb A callback that takes two parameters. cb(Error, [RESULT])
     */
    init(cb) {

        //prepare index values
        var expiry = Math.floor(Configuration.active.registry.update_interval / DateUtils.MILLIS_PER_SEC);
        var procedure = {
            collection: Configuration.active.registry.key,
            spec: {last_modified: 1},
            options: {expireAfterSeconds: expiry}
        };

        //ensure an index exists.  According to the MongoDB documentation ensure
        //index cannot modify a TTL value once it is created.  Therefore, we have
        //to ensure that the index exists and then verify that the expiry matches.
        //When it doesn't match we must create a system lock, drop the index, and
        //recreate it.  Due to the permissions levels of some mongo hosting
        //providers the collMod command cannot be used.
        var TTLIndexHelper = require('../../dao/mongo/ttl_index_helper.js')(pb);
        var helper = new TTLIndexHelper();
        helper.ensureIndex(procedure, cb);
    }

    /**
     * Should be called during shutdown.  It is responsible for removing the
     * process/node from the registry.
     * @static
     * @method shutdown
     * @param {String} id The unique identifier for the node/process
     * @param {Function} cb A callback that takes two parameters: cb(Error, [RESULT])
     */
    shutdown(id, cb) {
        log.debug('MongoRegistrationProvider: Shutting down...');

        //verify an ID was passed
        if (!id) {
            log.error('MongoRegistrationProvider: A valid ID is needed in order to properly shutdown');
            cb(null, false);
        }

        //ID is always a string so we don't use DAO.getIdWhere(id)
        var where = {};
        where[DAO.getIdField()] = id;
        var dao = new DAO();
        dao.delete(where, Configuration.active.registry.key, cb);
    }
}

module.exports = MongoRegistrationProvider;
