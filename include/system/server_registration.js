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

 function ServerRegistration(){}

 //dependencies
 var cluster = require('cluster');
 var os      = require('os');
 var domain  = require('domain');

 //statics
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

 var TIMER_HANDLE = null;

 ServerRegistration.prototype.getClusterStatus = function(cb) {
	 pb.cache.hgetall(pb.config.registry.key, cb);
 };

/**
 * Removes all entries from the server registry
 *
 */
ServerRegistration.flush = function(cb) {
    pb.cache.del(pb.config.registry.key, cb);
};

 ServerRegistration.init = function() {
	 if (!pb.config.registry.enabled) {
		 return false;
	 }
	 else if (TIMER_HANDLE !== null) {
		 return true;
	 }

	 ServerRegistration.doRegistration();
	 TIMER_HANDLE = setInterval(function() {
		 ServerRegistration.doRegistration();
	 }, pb.config.registry.update_interval);
 };

 ServerRegistration.shutdown = function(cb) {
	 cb = cb || pb.utils.cb;

	 if (TIMER_HANDLE) {
		 clearInterval(TIMER_HANDLE);
		 pb.cache.hdel(pb.config.registry.key, ServerRegistration.generateKey(), cb);
	 }
	 else {
		 cb(null, true);
	 }
 };

 ServerRegistration.addItem = function(name, itemValueFunction) {
	 if (!pb.validation.validateNonEmptyStr(name, true) || !pb.utils.isFunction(itemValueFunction)) {
		 return false;
	 }

	 ITEM_CALLBACKS[name] = itemValueFunction;
	 return true;
 };

 ServerRegistration.doRegistration = function(cb) {
	 cb = cb || pb.utils.cb;

	 var onItemsGathered = function(err, update) {
		 if (util.isError(err)) {
			 pb.log.error("ServerRegistration: Failed to gather all data for registration: %s", err.message);
		 }

		 if (update) {
			 var key = ServerRegistration.generateKey();
			 update.last_update = new Date();
			 pb.cache.hset(pb.config.registry.key, key, JSON.stringify(update), function(err, result) {
				 pb.log.debug("ServerRegistration: Attempted to update registration. KEY=[%s] Result=[%s] ERROR=[%s]", key, result === 1 || result === 0, err ? err.message : 'NONE');
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

 ServerRegistration.generateKey = function() {
	 return  ServerRegistration.getIp() + ':' + pb.config.sitePort + ':' + (cluster.worker ? cluster.worker.id : 'master') + ':' + os.hostname();
 };

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
