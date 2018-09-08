const cluster = require('cluster');
const os = require('os');
const _ = require('lodash');

module.exports = (pb) => {

    /************************************************************
     * Service that provides the ability for the process/node to register itself so
     * that other nodes in the system can find it.  In addition, it helps with the
     * health monitoring of the system.
     */
    class ServerRegistry {

        constructor (provider) {
            if (!provider) {
                throw new Error('RegistrationProvider instance is required');
            }
            this.provider = provider;
            this.timerHandle = null;
        }

        /**
         * Should only be called once at startup.  The function verifies that the
         * registry is enabled and initializes the correct storage provider.
         */
        async init () {
            if(!pb.config.registry.enabled) {
                return false;
            }
            else if (this.timerHandle) { // Already initialized
                return true;
            }

            //initialize the provider
            await this.provider.init();

            this.timerHandle = setInterval(() => this._doRegistration(), pb.config.registry.update_interval);
            this._doRegistration();
            return true;
        }

        async _doRegistration () {
            //ensure a provider was instantiated.
            //Server registration could be turned off.
            if (!this.provider) {
                return false;
            }

            let registryData = this._runTasks();

            if(!registryData) {
                return false;
            }

            //perform the registration update
            registryData.id = ServerRegistry.processKey;
            registryData.last_update = new Date();

            return this._saveRegistryData(registryData);
        };
        _runTasks() {
            let tasks = ServerRegistry.tasks;
            let results = null;
            try {
                results =  _.mapValues(tasks, (func) => typeof func === 'function' && func());
            } catch (err) {
                pb.log.error(`ServerRegistration: Failed to gather all data for registration: ${err.message}`);
            }
            return results;
        }
        // registry
        async _saveRegistryData(registryData) {
            let saveStatus = false;
            let err = null;
            try {
                saveStatus = await this.provider.setNodeStatus(registryData.id, registryData); // TODO: Promisify this function(err, result) {
            } catch (e) {
                err = e;
            }

            ServerRegistry.logUpdateResult(registryData.id, registryData, err, saveStatus);
        }

        /**************************************************
         * Shut down functions
         */
        // Removes all entries from the server registry
        async flush () {
            return this.provider.flush();
        };

        async shutdown () {
            if (!this.timerHandle) {
                return true;
            }

            clearInterval(this.timerHandle);
            return this.provider.shutdown(ServerRegistry.processKey);
        };

        /**************************************************
         * Instanced Properties
         */
        get clusterStatus () {
            // Retrieves the most recent status from the entire cluster.
            return this.provider.getClusterStatus();
        };

        /**************************************************
         * static properties
         */

        static get tasks () {
            if (this._tasks) {
                return this._tasks;
            }

            this._tasks = {
                ip: () => ServerRegistry.ip,
                is_master: () => cluster.isMaster,
                process_type: () => cluster.worker ? 'Worker' : 'Master',
                worker_id: () => cluster.worker ? cluster.worker.id : 'M',
                port: () => pb.config.sitePort,
                host: () => os.hostname(),
                pid: () => process.pid,
                node_version: () => process.version,
                active_plugins: () => {
                    let pluginService = new pb.PluginService();
                    return pluginService.getAllActivePluginNames();
                },
                uptime: () => process.uptime(),
                mem_usage: () => process.memoryUsage(),
                cwd: () => process.cwd(),
                type: () => 'pencilblue',
                pb_version: () => pb.config.version,
                update_interval: () => pb.config.registry.update_interval
            };

            return this._tasks;
        }
        static get ip () {
            let interfaces = os.networkInterfaces();
            let address = null;

            for (var k in interfaces) {
                for (var k2 in interfaces[k]) {
                    var addr = interfaces[k][k2];
                    if (addr.family === 'IPv4' && !addr.internal) {
                        address = addr.address;
                        break;
                    }
                }
            }
            return address;
        };

        //Generates the unique key for the PB process/node.
        static get processKey () {
            let port = pb.config.sitePort;
            let clusterId = cluster.worker ? cluster.worker.id : 'M';
            return `${this.ip}:${port}:${clusterId}:${os.hostname()}`;
        }

        // Retrieves a unique key for the server but not for the process
        static get serverKey () {
            let port = pb.config.sitePort;
            return `${this.ip}:${port}:${os.hostname()}`;
        };

        /**************************************************
         * Handle Status Update Function Stack
         */

        // Registers a function to be called on every status update.
        static addItem (name, itemValueFunction) {
            if (!name || !pb.util.isFunction(itemValueFunction)) {
                return false;
            }

            this.tasks[name] = itemValueFunction;
            return true;
        };

        static logUpdateResult (key, update, err, result) {
            if (pb.config.registry.logging_enabled) {
                pb.log.debug(`ServerRegistration: Attempted to update registration. KEY=[${key}] Result=[${pb.util.inspect(result)}] ERROR=[${err ? err.message : 'NONE'}]`);
                pb.log.silly(`ServerRegistration: Last Update\n${pb.util.inspect(update)}`);
            }
        };

        /**************************************************
         * Static function for getting the singleton of this class
         */
        static getInstance (provider) {
            if (this.instance) {
                return this.instance;
            }

            provider = provider || this._generateProvider();

            return (this.instance = new ServerRegistry(provider));
        };
        static _generateProvider () {
            let RegistrationProvider;
            if (pb.config.registry.type === 'redis') {
                RegistrationProvider = pb.RedisRegistrationProvider;
            }
            else if (pb.config.registry.type === 'mongo') {
                RegistrationProvider = pb.MongoRegistrationProvider;
            }
            else {
                RegistrationProvider = require(pb.config.registry.type)(pb);
            }
            return new RegistrationProvider();
        }
    }
    
    return ServerRegistry;
};
