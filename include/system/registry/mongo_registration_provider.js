const Promise = require('bluebird');

module.exports = (pb) => {
    const TTLIndexHelper = require('../../dao/mongo/ttl_index_helper.js')(pb);

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
        constructor() {
            this.dao = new pb.DAO();
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
        async init () {
            //prepare index values
            let expiry = MongoRegistrationProvider.expiry;
            let procedure = {
                collection: pb.config.registry.key,
                spec: { last_modified: 1 },
                options: { expireAfterSeconds: expiry }
            };

            //ensure an index exists.  According to the MongoDB documentation ensure
            //index cannot modify a TTL value once it is created.  Therefore, we have
            //to ensure that the index exists and then verify that the expiry matches.
            //When it doesn't match we must create a system lock, drop the index, and
            //recreate it.  Due to the permissions levels of some mongo hosting
            //providers the collMod command cannot be used.
            let helper = Promise.promisifyAll(new TTLIndexHelper());
            return helper.ensureIndexAsync(procedure);
        };

        /**
         * Retrieves the entire cluster status as an array of status objects.  The '_id'
         * property uniquely identifies each process/node.
         * @method getClusterStatus
         * @returns {Promise} Array of statuses
         */
        async getClusterStatus() {
            return this.dao.qAsync(pb.config.registry.key, {where: pb.DAO.ANYWHERE});
        }

        /**
         * Updates the status of a single node.
         * @method setNodeStatus
         * @param {String} id The unique identifier for the process/node
         * @param {Object} status The status information
         * @returns {Promise}
         */
        async setNodeStatus(id, status) {
            if (!util.isObject(status)) {
                throw new Error('The status parameter must be a valid object');
            }

            status[pb.DAO.getIdField()] = id;
            status.object_type = pb.config.registry.key;
            return this.dao.save(status);
        }

        /**
         * Purges all statuses from storage.
         * @method flush
         * @returns {Promise}
         */
        async flush () {
            return this.dao.deleteAsync(pb.DAO.ANYWHERE, pb.config.registry.key);
        }

        /**
         * Should be called during shutdown.  It is responsible for removing the
         * process/node from the registry.
         * @static
         * @method shutdown
         * @param {String} id The unique identifier for the node/process
         * @returns {Promise}
         */
        async shutdown (id) {
            pb.log.debug('MongoRegistrationProvider: Shutting down...');

            //verify an ID was passed
            if (!id) {
                pb.log.error('MongoRegistrationProvider: A valid ID is needed in order to properly shutdown');
                return false;
            }

            // ID is always a string so we don't use pb.DAO.getIdWhere(id)
            let where = {
                [pb.DAO.getIdField()]: id
            };
            return this.dao.deleteAsync(where, pb.config.registry.key);
        };

        /******************************
         * Static Properties
         */
        static get expiry () {
            return Math.floor(pb.config.registry.update_interval / pb.util.TIME.MILLIS_PER_SEC);
        }
    }

    return MongoRegistrationProvider;
};
