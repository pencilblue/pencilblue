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
 * Service for layering storage services
 *
 * @module Services
 * @submodule Storage
 * @class SimpleLayeredService
 * @constructor
 * @param {Array} services Array of services
 * @param {String} [name]  The name to assign to this service
 */
function SimpleLayeredService(services, name){
	this.services = services;
	this.name     = name ? name : 'SimpleLayeredService';

	if (pb.log.isDebug()) {
		this.logInitialization();
	}
}

SimpleLayeredService.prototype.logInitialization = function() {
	var serviceTypes = [];
	for (var i = 0; i < this.services.length; i++){
		serviceTypes.push(this.services[i].type);
	}

	if (pb.log.isDebug()) {
		pb.log.debug(this.name+": Initialized with layers - "+JSON.stringify(serviceTypes));
	}
};

/**
 * Retrieves the setting value from various storage areas.
 *
 * @method get
 * @param {String} key
 * @param {Object} cb Callback function
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
 *
 * @method set
 * @param {String} key
 * @param {*}      value
 * @param cb       Callback function
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
 *
 * @method purge
 * @param {String} key
 * @param cb       Callback function
 */
SimpleLayeredService.prototype.purge = function(key, cb){
	var tasks = pb.utils.getTasks(this.services, function(services, i) {
		return function(callback) {
			services[i].purge(key, callback);
		};
	});
	async.series(tasks, cb);
};

//exports
module.exports.SimpleLayeredService = SimpleLayeredService;
