/**
 * ThemeService - 
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function ThemeService(useMemory, useCache) {
	
	var objType  = 'theme';
	var services = [];
	
	//add in-memory service
	if (useMemory){
		services.push(new pb.MemoryEntityService(objType));
	}
	
	//add cache service
	if (useCache) {
		services.push(new pb.CacheEntityService(objType));
	}
	
	//always add JSON
	services.push(new pb.JSONFSEntityService(objType));
	this.service = new pb.ReadOnlySimpleLayeredService(services, 'ThemeService');
};

//exports
module.exports.ThemeService = ThemeService;
