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
var util = require('../../util.js');

module.exports = function MongoRegistrationProviderModule(pb) {

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
    function MongoRegistrationProvider(){}

    /**
     * Retrieves the entire cluster status as an array of status objects.  The '_id'
     * property uniquely identifies each process/node.
     * @method get
     * @param {Function} cb A callback that provides two parameters: cb(Error, Array)
     */
    MongoRegistrationProvider.prototype.get = function(cb) {

        var dao = new pb.DAO();
        dao.q(pb.config.registry.key, {where: pb.DAO.ANYWHERE}, cb);
    };

    /**
     * Updates the status of a single node.
     * @method set
     * @param {String} id The unique identifier for the process/node
     * @param {Object} status The status information
     * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
     */
    MongoRegistrationProvider.prototype.set = function(id, status, cb) {
        if (!util.isObject(status)) {
            cb(new Error('The status parameter must be a valid object'));
            return;
        }

        status[pb.DAO.getIdField()] = id;
        status.object_type = pb.config.registry.key;
        var dao = new pb.DAO();
        dao.save(status, cb);
    };

    /**
     * Purges all statuses from storage.
     * @method flush
     * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
     */
    MongoRegistrationProvider.prototype.flush = function(cb) {
        var dao = new pb.DAO();
        dao.delete(pb.DAO.ANYWHERE, pb.config.registry.key, cb);
    };

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
    MongoRegistrationProvider.prototype.init = function(cb) {

        //prepare index values
        var expiry    = Math.floor(pb.config.registry.update_interval / util.TIME.MILLIS_PER_SEC);
        var procedure = {
            collection: pb.config.registry.key,
            spec: { last_modified: 1 },
            options: { expireAfterSeconds: expiry }
        }

        //ensure an index exists.  According to the MongoDB documentation ensure
        //index cannot modify a TTL value once it is created.  Therefore, we have
        //to ensure that the index exists and then verify that the expiry matches.
        //When it doesn't match we must create a system lock, drop the index, and
        //recreate it.  Due to the permissions levels of some mongo hosting
        //providers the collMod command cannot be used.
        var TTLIndexHelper = require('../../dao/mongo/ttl_index_helper.js')(pb);
        var helper = new TTLIndexHelper();
        helper.ensureIndex(procedure, cb);
    };

    /**
     * Should be called during shutdown.  It is responsible for removing the
     * process/node from the registry.
     * @static
     * @method shutdown
     * @param {String} id The unique identifier for the node/process
     * @param {Function} cb A callback that takes two parameters: cb(Error, [RESULT])
     */
    MongoRegistrationProvider.prototype.shutdown = function(id, cb) {
        pb.log.debug('MongoRegistrationProvider: Shutting down...');

        //verify an ID was passed
        if (!id) {
            pb.log.error('MongoRegistrationProvider: A valid ID is needed in order to properly shutdown');
            cb(null, false);
        }

        //ID is always a string so we don't use pb.DAO.getIdWhere(id)
        var where = {};
        where[pb.DAO.getIdField()] = id;
        var dao = new pb.DAO();
        dao.delete(where, pb.config.registry.key, cb);
    };

    return MongoRegistrationProvider;
};
