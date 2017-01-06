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
var cluster = require('cluster');
var Configuration = require('../config');
var log = require('../utils/logging').newInstance('ServerRegistration');
var os      = require('os');
var domain  = require('domain');
var async   = require('async');
var util    = require('util');

/**
 * Singleton instance
 * @private
 * @static
 * @property INSTANCE
 * @type {ServerRegistration}
 */
var INSTANCE = null;

/**
 * Service that provides the ability for the process/node to register itself so
 * that other nodes in the system can find it.  In addition, it helps with the
 * health monitoring of the system.
 * @class ServerRegistration
 * @constructor
 */
function ServerRegistration(provider){
    if (!provider) {
        throw new Error('RegistrationProvider instance is required');
    }
    this.provider = provider;
    this.timerHandle = null;
}

/**
 * The default set of functions that gather the default set of information.
 * @private
 * @property ITEM_CALLBACKS
 * @type {Object}
 */
var ITEM_CALLBACKS = {

    //ip address
    ip: function(cb) {
        cb(null, ServerRegistration.getIp());
    },

    is_master: function(cb) {
        cb(null, cluster.isMaster);
    },

    //TODO [1.0] move the naming and ID convention to a utils class for workers so it can be shared between here and System
    process_type: function(cb) {
        cb(null, cluster.worker ? 'Worker' : 'Master');
    },

    worker_id: function(cb) {
        cb(null, cluster.worker ? cluster.worker.id : 'M');
    },

    port: function(cb) {
        cb(null, Configuration.active.sitePort);
    },

    host: function(cb) {
        cb(null, os.hostname());
    },

    pid: function(cb) {
        cb(null, process.pid);
    },

    node_version: function(cb) {
        cb(null, process.version);
    },

    //TODO move this to an init method in plugin service.  We need to do this because this low level service should not be responsible for tracking active plugins.  Each service should register the items that are needed
    // active_plugins: function(cb) {
    //     var pluginService = new pb.PluginService();
    //     cb(null, pluginService.getAllActivePluginNames());
    // },

    uptime: function(cb) {
        cb(null, process.uptime());
    },

    mem_usage: function(cb) {
        cb(null, process.memoryUsage());
    },

    cwd: function(cb) {
        cb(null, process.cwd());
    },

    type: function(cb) {
        cb(null, 'pencilblue');
    },

    pb_version: function(cb) {
        cb(null, Configuration.active.version);
    },

    update_interval: function(cb) {
        cb(null, Configuration.active.registry.update_interval);
    }
};

/**
 * Retrieves the most recent status from the entire cluster.
 * @method getClusterStatus
 * @param {Function} cb A callback that provides two parameters: cb(Error, Array)
 */
ServerRegistration.prototype.getClusterStatus = function(cb) {
    this.provider.get(cb);
};

/**
 * Removes all entries from the server registry
 * @static
 * @method flush
 * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
 */
ServerRegistration.prototype.flush = function(cb) {
    this.provider.flush(cb);
};

/**
 * Should only be called once at startup.  The function verifies that the
 * registry is enabled and initializes the correct storage provider.
 * @static
 * @method init
 * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
 */
ServerRegistration.prototype.init = function(cb) {
    if (!Configuration.active.registry.enabled) {
         return cb(null, false);
     }
     else if (this.timerHandle !== null) {
         return cb(null, true);
     }

     //initialize the provider
    var self = this;
    this.provider.init(function(err, result) {
        if (_.isError(err) || !result) {
            return cb(err, false);
        }

        //do first update and schedule the rest
        self.doRegistration();
        self.timerHandle = setInterval(function() {
            self.doRegistration();
        }, Configuration.active.registry.update_interval);

        cb(err, true);
    });
};

/**
 * Called during shutdown.  The function is responsible for clearing any
 * scheduled updates and shutting down the storage provider.
 * @static
 * @method shutdown
 * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
 */
ServerRegistration.prototype.shutdown = function(cb) {
    cb = cb || function() {};

    if (!this.timerHandle) {
        return cb(null, true);
    }

    clearInterval(this.timerHandle);
    this.provider.shutdown(ServerRegistration.generateKey(), cb);
};

/**
 * Registers a function to be called on every status update.  The function
 * should take one parameter: a callback function that accepts two parameters,
 * the first being an error if it occurred and the second being the current
 * value for the information requested.
 * @static
 * @method addItem
 * @param {String} name The name and/or description of the information being
 * gathered
 * @param {Function} The function to be called to gather the data.
 * @return {Boolean} TRUE if the function is successfully registered, FALSE if not.
 */
ServerRegistration.addItem = function(name, itemValueFunction) {
     if (!ValidationService.isNonEmptyStr(name, true) || !_.isFunction(itemValueFunction)) {
         return false;
     }

     ITEM_CALLBACKS[name] = itemValueFunction;
     return true;
};

/**
 * Performs the request for information and persists it through the storage
 * provider.
 * @static
 * @method doRegistration
 * @param {Function} [cb] A callback that provides two parameters: cb(Error, [RESULT])
 */
ServerRegistration.prototype.doRegistration = function(cb) {
    cb = cb || function() {};

    //ensure a provider was instantiated.
    //Server registration could be turned off.
    if (!this.provider) {
        return cb(null, false);
    }

    //create a function to execute when all items have been retrieved
    var self = this;
    var onItemsGathered = function(err, update) {
        if (_.isError(err)) {
            log.error("ServerRegistration: Failed to gather all data for registration: %s", err.message);
        }
        else if (!_.isObject(update)) {
            return cb(err, false);
        }

        //perform the registration update
        update.id          = ServerRegistration.generateKey();
        update.last_update = new Date();
        self.provider.set(update.id, update, function(err, result) {
            ServerRegistration.logUpdateResult(update.id, update, err, result);
            cb(err, result);
        });
     };

     var d = domain.create();
     d.on('error', function(err) {
        log.error('ServerRegistration: Failed to perform update: %s', err.stack);
     });
     d.run(function() {
         async.parallel(ITEM_CALLBACKS, onItemsGathered);
     });
};

/**
 *
 * @static
 * @method logUpdateResult
 * @param {String} key
 * @param {Object} update
 * @param {Error} err
 * @param {Boolean} result
 */
ServerRegistration.logUpdateResult = function(key, update, err, result) {
    if (Configuration.active.registry.logging_enabled) {
        if (log.isDebug()) {
            log.debug("ServerRegistration: Attempted to update registration. KEY=[%s] Result=[%s] ERROR=[%s]", key, util.inspect(result), err ? err.message : 'NONE');
        }
        if (log.isSilly()) {
            log.silly("ServerRegistration: Last Update\n%s", util.inspect(update));
        }
    }
};

/**
 * Generates the unique key for the PB process/node.
 * @static
 * @method generateKey
 * @return {String} The unique identifier
 */
ServerRegistration.generateKey = function() {
    return ServerRegistration.getIp() + ':' + Configuration.active.sitePort + ':' + (cluster.worker ? cluster.worker.id : 'M') + ':' + os.hostname();
};

/**
 * Retrieves a unique key for the server but not for the process
 * @static
 * @method generateServerKey
 * @return {String} server key
 */
ServerRegistration.generateServerKey = function() {
    return ServerRegistration.getIp() + ':' + Configuration.active.sitePort + ':' + os.hostname();
};

/**
 * Retrieves the first IP address found for the node.
 * @static
 * @method getIp
 * @return {String} The first IP address found for the node
 */
ServerRegistration.getIp = function() {
     var interfaces = os.networkInterfaces();
     var address = null;
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

/**
 * Retrieves the singleton instance of the service registry
 * @static
 * @method getInstance
 * @param {RegistrationProvider} [provider]
 * @return {ServerRegistration}
 */
ServerRegistration.getInstance = function(provider) {
    if (INSTANCE) {
        return INSTANCE;
    }

    //create a provider if not provided
    if (!provider) {

        var RegistrationProvider = null;
        if (Configuration.active.registry.type === 'redis') {
            RegistrationProvider = require('./registry/redis_registration_provider');
        }
        else if (Configuration.active.registry.type === 'mongo') {
            RegistrationProvider = require('./registry/mongo_registration_provider');
        }
        else {
            RegistrationProvider = require(Configuration.active.registry.type);
        }
        provider = new RegistrationProvider();
    }

    return (INSTANCE = new ServerRegistration(provider));
};

module.exports = ServerRegistration;
