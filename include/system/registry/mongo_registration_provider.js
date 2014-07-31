/*
    Copyright (C) 2014  PencilBlue, LLC

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
    dao.query(pb.config.registry.key, pb.DAO.ANYWHERE).then(function(statuses) {
        if (util.isError(statuses)) {
            cb(statuses);
            return;
        }

        cb(null, statuses);
    });
};

/**
 * Updates the status of a single node.
 * @method set
 * @param {String} id The unique identifier for the process/node
 * @param {Object} status The status information
 * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
 */
MongoRegistrationProvider.prototype.set = function(id, status, cb) {
    if (!pb.utils.isObject(status)) {
        cb(new Error('The status parameter must be a valid object'));
        return;
    }

    status._id         = id;
    status.object_type = pb.config.registry.key;
    var dao = new pb.DAO();
    dao.update(status).then(function(result) {
        if (util.isError(result)) {
            cb(result);
            return;
        }
        cb(null, result);
    });
};

/**
 * Purges all statuses from storage.
 * @method flush
 * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
 */
MongoRegistrationProvider.prototype.flush = function(cb) {
    var dao = new pb.DAO();
    dao.deleteMatching(pb.DAO.ANYWHERE, pb.config.registry.key).then(function(result) {
        if (util.isError(result)) {
            cb(result);
            return;
        }
        cb(null, result);
    });
};

/**
 * This function should only be called once at startup.  It is responsible for
 * setting up the collection and ensuring that the TTL index is configured
 * correctly based on the the executing processes configuration.  <b>NOTE:</b>
 * The collection only supports one TTL value. The last process to startup and
 * configure the index will win.  Please be careful to ensure that all PB
 * processes/nodes have the same registry.update_interval value.
 * @static
 * @method init
 * @param {Function} cb A callback that takes two parameters. cb(Error, [RESULT])
 */
MongoRegistrationProvider.init = function(cb) {

    //prepare index values
    var expiry    = Math.floor(pb.config.registry.update_interval / pb.utils.TIME.MILLIS_PER_SEC);
    var procedure = {
        collection: pb.config.registry.key,
        spec: { last_modified: 1 },
        options: { expireAfterSeconds: expiry }
    }

    //ensure an index exists.  According to the MongoDB documentation ensure
    //index cannot modify a TTL value once it is created.  Therefore, we have
    //to ensure that the index exists and then send the collection modification
    //command to change the TTL value.
    var dao = new pb.DAO();
    dao.ensureIndex(procedure, function(err, result) {
        pb.log.silly('MongoRegistrationProvider: Attempted to ensure TTL index. RESULT=[%s] ERROR=[%s]', util.inspect(result), err ? err.message : 'NONE');

         var command = {
            collMod: pb.config.registry.key,
            index: {
                keyPattern: {last_modified:1},
                expireAfterSeconds: expiry
            }
        };
        dao.command(command, function(err, result) {
            pb.log.silly('MongoRegistrationProvider: Attempted to modify the TTL index. RESULT=[%s] ERROR=[%s]', util.inspect(result), err ? err.message : 'NONE');
            cb(err, result);
        });
    });
};

/**
 * Should be called during shutdown.  It is responsible for removing the
 * process/node from the registry.
 * @static
 * @method shutdown
 * @param {String} id The unique identifier for the node/process
 * @param {Function} cb A callback that takes two parameters: cb(Error, [RESULT])
 */
MongoRegistrationProvider.shutdown = function(id, cb) {
    pb.log.debug('MongoRegistrationProvider: Shutting down...');

    //verify an ID was passed
    if (!id) {
        pb.log.error('MongoRegistrationProvider: A valid ID is needed in order to properly shutdown');
        cb(null, false);
    }

    var where = {
        _id: id
    };
    var dao = new pb.DAO();
    dao.deleteMatching(where, pb.config.registry.key).then(function(result) {
        if (util.isError(result)) {
            cb(result);
            return;
        }

        cb(null, result);
    });
};

//exports
module.exports = MongoRegistrationProvider;
