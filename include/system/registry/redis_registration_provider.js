const Promise =  require('bluebird');
module.exports = (pb) => {

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

        async init () {
            if (RedisRegistrationProvider._client) {
                return;
            }

            let databaseId = RedisRegistrationProvider.registryDB;

            RedisRegistrationProvider._client = Promise.promisifyAll(pb.CacheFactory.createInstance());
            return RedisRegistrationProvider.client.selectAsync(databaseId);
        }

        /**************************************************
         * Get and Set cluster Status Functions
         *
         */
        async getClusterStatus () {
            let pattern = RedisRegistrationProvider.pattern;
            let keys = await RedisRegistrationProvider.client.keysAsync(pattern);

            let statusObj = await RedisRegistrationProvider.client.mgetAsync(keys);

            return Object.keys(statusObj)
                .map(key => {
                    let status = null;
                    try {
                        status = JSON.parse(statusObj[key]);
                        status._id = status.id || key;
                    } catch(e){}
                    return status;
                })
                .filter(status => !!status);
        };

        async setNodeStatus (id, status) {
            if (!pb.util.isObject(status)) {
                throw new Error('The status parameter must be a valid object');
            }

            let key = RedisRegistrationProvider.getCacheKey(id);
            let expiry = RedisRegistrationProvider.expiry;

            return RedisRegistrationProvider.client.setexAsync(key, expiry, JSON.stringify(status));
        };

        /**************************************************
         * Shut down functions
         *
         */
        async flush () {
            let pattern = RedisRegistrationProvider.pattern;
            let keys = await RedisRegistrationProvider.client.keysAsync(pattern);

            return RedisRegistrationProvider.client.delAsync(keys);
        };

        async shutdown (id) {
            if (!id) {
                pb.log.error('RedisRegistrationProvider: A valid ID is needed in order to properly shutdown');
                return false;
            }

            let key = RedisRegistrationProvider.getCacheKey(id);
            return RedisRegistrationProvider.client.delAsync(key);
        };

        /**************************************************
         * Static Properties
         *
         */
        static get registryDB () {
            if (this._registryDB) {
                return this._registryDB;
            }
            this._registryDB = 0;
            return this._registryDB;
        }
        static get sep () {
            return '-';
        }

        static get client () {
            return this._client || null;
        }

        static get expiry () {
            return Math.floor(pb.config.registry.update_interval / pb.util.TIME.MILLIS_PER_SEC);
        }

        static get pattern () {
            return `${pb.config.registry.key}*`;
        }

        static getCacheKey (id) {
            return [pb.config.registry.key, id].join(RedisRegistrationProvider.sep);
        };
    }

    return RedisRegistrationProvider;
};
