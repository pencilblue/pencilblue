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

//dependencies
var cluster              = require('cluster');
var os                   = require('os');
var domain               = require('domain');
var RegistrationProvider = null;

/**
 * Service that provides the ability for the process/node to register itself so
 * that other nodes in the system can find it.  In addition, it helps with the
 * health monitoring of the system.
 * @class ServerRegistration
 * @constructor
 */
function ServerRegistration(){}

/**
 * The instance of the RegistrationProvider interface to use as the storage
 * provider.
 * @private
 * @property PROVIDER
 * @type {RedisRegistrationProvider|MongoRegistrationProvider}
 */
var PROVIDER = null;

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

	 process_type: function(cb) {
        cb(null, cluster.worker ? 'Worker' : 'Master');
	 },

	 worker_id: function(cb) {
		 cb(null, cluster.worker ? cluster.worker.id : 'master');
	 },

	 port: function(cb) {
		 cb(null, pb.config.sitePort);
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

	 active_plugins: function(cb) {
		 cb(null, pb.plugins.getActivePluginNames());
	 },

	 uptime: function(cb) {
		 cb(null, process.uptime());
	 },

	 mem_usage: function(cb) {
		 cb(null, process.memoryUsage());
	 },

	 cwd: function(cb) {
		 cb(null, process.cwd());
	 },
 };

/**
 * The handle to the interval that is set to ensure that updates are regularly
 * sent to the storage provider.
 * @private
 * @property TIMER_HANDLE
 * @type {Integer}
 */
var TIMER_HANDLE = null;

/**
 * Retrieves the most recent status from the entire cluster.
 * @method getClusterStatus
 * @param {Function} cb A callback that provides two parameters: cb(Error, Array)
 */
ServerRegistration.prototype.getClusterStatus = function(cb) {
	 PROVIDER.get(cb);
};

/**
 * Removes all entries from the server registry
 * @static
 * @method flush
 * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
 */
ServerRegistration.flush = function(cb) {
    PROVIDER.flush(cb);
};

/**
 * Should only be called once at startup.  The function verifies that the
 * registry is enabled and initializes the correct storage provider.
 * @static
 * @method init
 * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
 */
ServerRegistration.init = function(cb) {
    if (!pb.config.registry.enabled) {
		 cb(null, false);
	 }
	 else if (TIMER_HANDLE !== null) {
		 cb(null, true);
	 }

     //identify the provider
     RegistrationProvider = null;
     if (pb.config.registry.type === 'redis') {
         RegistrationProvider = pb.RedisRegistrationProvider;
     }
     else if (pb.config.registry.type === 'mongo') {
        RegistrationProvider = pb.MongoRegistrationProvider;
     }
     else {
        RegistrationProvider = require(pb.config.registry.type);
     }

     //initialize the provider
     RegistrationProvider.init(function(err, result) {

         //create the provider instance
         PROVIDER = new RegistrationProvider();

         //do first update and schedule the rest
         ServerRegistration.doRegistration();
         TIMER_HANDLE = setInterval(function() {
             ServerRegistration.doRegistration();
         }, pb.config.registry.update_interval);

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
ServerRegistration.shutdown = function(cb) {
	 cb = cb || pb.utils.cb;

	 if (TIMER_HANDLE) {
		 clearInterval(TIMER_HANDLE);
		 RegistrationProvider.shutdown(ServerRegistration.generateKey(), cb);
	 }
	 else {
		 cb(null, true);
	 }
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
	 if (!pb.validation.validateNonEmptyStr(name, true) || !pb.utils.isFunction(itemValueFunction)) {
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
 * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
 */
ServerRegistration.doRegistration = function(cb) {
	 cb = cb || pb.utils.cb;

	 var onItemsGathered = function(err, update) {
		 if (util.isError(err)) {
			 pb.log.error("ServerRegistration: Failed to gather all data for registration: %s", err.message);
		 }

		 if (update) {
			 var key            = ServerRegistration.generateKey();
             update.id          = key;
			 update.last_update = new Date();
			 PROVIDER.set(key, update, function(err, result) {
				 pb.log.debug("ServerRegistration: Attempted to update registration. KEY=[%s] Result=[%s] ERROR=[%s]", key, util.inspect(result), err ? err.message : 'NONE');
				 if (pb.log.isSilly) {
					 pb.log.silly("ServerRegistration: Last Update\n%s", util.inspect(update));
				 }
				 cb(err, result);
			 });
		 }
		 else {
			 cb(err, false);
		 }
	 };

	 var d = domain.create();
	 d.on('error', function(err) {
		pb.log.error('ServerRegistration: Failed to perform update: %s', err.stack);
	 });
	 d.run(function() {
		 async.parallel(ITEM_CALLBACKS, onItemsGathered);
	 });
};

/**
 * Generates the unique key for the PB process/node.
 * @static
 * @method generateKey
 * @return {String} The unique identifier
 */
ServerRegistration.generateKey = function() {
	 return  ServerRegistration.getIp() + ':' + pb.config.sitePort + ':' + (cluster.worker ? cluster.worker.id : 'M') + ':' + os.hostname();
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
	 for (k in interfaces) {
	     for (k2 in interfaces[k]) {
	         var addr = interfaces[k][k2];
	         if (addr.family == 'IPv4' && !addr.internal) {
	             address = addr.address;
	             break;
	         }
	     }
	 }
	 return address;
};

//register for shutdown
pb.system.registerShutdownHook('ServerRegistration', ServerRegistration.shutdown);

 //exports
 module.exports = ServerRegistration;
