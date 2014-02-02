/**
 * SimpleObjectService
 */
function SimpleLayeredService(services, name){
	this.services = services;
	this.name     = name ? name : 'SimpleLayeredService';
	
	if (pb.log.isDebug()) {
		var serviceTypes = [];
		for (var i = 0; i < this.services.length; i++){
			serviceTypes.push(this.services[i].type);
		}
		
		if (pb.log.isDebug()) {
			pb.log.debug(name+": Initialized with layers - "+JSON.stringify(serviceTypes));
		}
	}
}

/**
 * Retrieves the setting value from various storage areas.
 * @param key
 * @param cb
 */
SimpleLayeredService.prototype.get = function(key, cb){
	
	var i              = 0;
	var resultNotFound = true;
	var entity         = null;
	var instance       = this;
	async.whilst(
		function() { //while
			return i < instance.services.length && resultNotFound;
		},
		function(callback) {//do
			if (pb.log.isSilly()) {
				pb.log.silly(instance.name+": Checking Service ["+instance.services[i].type+"] for Key ["+key+"]");
			}
			
			instance.services[i].get(key, function(err, result){
				if (util.isError(err)){
					resultNotFound = false;
					callback(err);
					return;
				}
				
				if (result) {
					resultNotFound = false;
					entity         = result;
				}
				else{
					i++;
				}

				callback();
			});
		},
		function(err){//when done
			
			if (entity) {
				
				//set value in services that didn't have it.
				for (var j = 0; j < i; j++) {
					instance.services[j].set(key, entity, pb.utils.cb);
				}
			}
			
			//callback to original caller
			cb(err, entity);
		}
	);
};

/**
 * Persists a new value for the setting.  When the setting does not exist a new 
 * one is created.
 * @param key
 * @param value
 * @param cb
 */
SimpleLayeredService.prototype.set = function(key, value, cb){
	var self = this;

	var tasks = [];
	for (var i = this.services.length -1; i >= 0; i--){
		var task = function(index){
			return function(callback) {
				if (pb.log.isSilly()) {
					pb.log.silly(self.name+":"+self.services[index].type+": Setting ["+key+"] Value ["+JSON.stringify(value)+"]");
				}
				self.services[index].set(key, value, callback);
			};
		};
		tasks.push(task(i));
	}
	async.series(tasks, cb);
};

/**
 * Removes the value from storage. 
 * @param key
 * @param cb
 */
SimpleLayeredService.prototype.purge = function(key, cb){
	var tasks = [];
	for (var i = 0; i < this.services.length; i++){
		var task = function(index){
			return function(callback) {
				this.services[index].purge(key, callback);
			};
		};
		tasks.push(task(i));
	}
	async.series(tasks, cb);
};

//exports
module.exports.SimpleLayeredService = SimpleLayeredService;