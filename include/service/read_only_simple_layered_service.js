/**
 * ReadOnlySimpleService - Read-Only Layered Service.  The read only 
 * functionality is ensured by overriding the "set" functions with those that 
 * always callback with error
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function ReadOnlySimpleLayeredService(services, name){
	this.services = services;
	this.name     = name ? name : 'ReadOnlySimpleLayeredService';
	
	//convert services
	for (var i = 0; i < this.services.length; i++) {
		ReadOnlySimpleLayeredService.makeReadOnly(this.services[i]);
	}
	
	if (pb.log.isDebug()) {
		this.logInitialization();
	}
}

//inheritance
util.inherits(ReadOnlySimpleLayeredService, pb.SimpleLayeredService);

ReadOnlySimpleLayeredService.prototype.set = function(key, value, cb) {
	cb(new PBError(this.name+": This service is readonly"), null);
};

ReadOnlySimpleLayeredService.makeReadOnly = function(serviceInstance) {
	serviceInstance.set = function(key, value, cb) {
		cb(new PBError(this.name+": This service is readonly"), null);
	};
};

//exports
module.exports.ReadOnlySimpleLayeredService = ReadOnlySimpleLayeredService;