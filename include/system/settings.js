/**
 * SettingServiceFactory - Creates a service that will provide access to settings
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 * 
 */
function SettingServiceFactory(){}

var count = 1;

SettingServiceFactory.getService = function(useMemory, useCache) {
	var objType    = 'setting';
	var keyField   = 'key';
	var valueField = 'value';
	var services = [];
	
	//add in-memory service
	if (useMemory){
		services.push(new pb.MemoryEntityService(objType, valueField, keyField));
	}
	
	//add cache service
	if (useCache) {
		services.push(new pb.CacheEntityService(objType, valueField, keyField));
	}
	
	//always add db service
	services.push(new pb.DBEntityService(objType, valueField, keyField));
	
	return new pb.SimpleLayeredService(services, 'SettingService' + count++);
};

//exports
module.exports.SettingServiceFactory = SettingServiceFactory;