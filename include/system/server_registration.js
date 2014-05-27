/**
 *
 */
 function ServerRegistration(){}
 
 //dependencies
 var cluster = require('cluster');
 var os      = require('os');
 
 //statics
 var ITEM_CALLBACKS = {
	 
	 //ip address
	 ip: function(cb) {
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
		 cb(null, address);
	 },
	 
	 is_master: function(cb) {
		 cb(null, cluster.isMaster);
	 },
	 
	 worker_id: function(cb) {
		 cb(null, cluster.worker.id);
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
		 cb(null, process.memUsage());
	 },
	 
	 cwd: function(cb) {
		 cb(null, process.cwd());
	 },
 };
 
 var TIMER_HANDLE = null;
 
 ServerRegistration.init = function() {
	 if (!pb.config.registry.enabled) {
		 return false;
	 }
	 else if (TIMER_HANDLE !== null) {
		 return true;
	 }
	 
	 TIMER_HANDLE = setInterval(function() {
		 ServerRegistration.doRegistration();
	 }, pb.config.registry.update_interval);
 };
 
 ServerRegistration.shutdown = function(cb) {
	 cb = cb || pb.utils.cb;
	 
	 if (TIMER_HANDLE) {
		 clearInterval(TIMER_HANDLE);
		 //TODO remove oneself from service
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
	 
	 async.parallel(ITEM_CALLBACKS, function(err, update) {
		 if (util.isError(err)) {
			 pb.log.error("ServerRegistration: Failed to gather all data for registration: %s", err.message);
		 }
		 
		 if (update) {
			 var key = ServerRegistration.generateKey();
			 update.last_update = new Date();
			 pb.cache.hset(pb.config.registry_key, key, JSON.stringify(update), function(err, result) {
				 pb.log.debug("ServerRegistration: Attempted to update registration. Result=[%s] ERROR=[%s]", result, err ? err.message : '');
				 cb(err, result);
			 });
		 }
		 else {
			 cb(err, false);
		 }
	 });
 };
 
 ServerRegistration.generateKey = function(update) {
	 return update.ip + ':' + update.port + ':' + update.worker + ':' + update.host;
 };
 
 //exports
 module.exports = ServerRegistration;