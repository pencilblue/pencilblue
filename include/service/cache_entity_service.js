/**
 * CacheEntityService - in cache storage
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function CacheEntityService(objType, valueField, keyField){
	this.type       = 'Cache';
	this.objType    = objType;
	this.keyField   = keyField;
	this.valueField = valueField ? valueField : null;
}

CacheEntityService.prototype.get = function(key, cb){
	
	var self = this;
	pb.cache.get(key, function(err, result){
		if (util.isError(err)) {
			cb(err, null);
			return;
		}
		
		//value doesn't exist in cache
		if (result == null) {
			cb(null, null);
			return;
		}
		
		//value exists
		var val = result;
		if (self.valueField != null){
			var rawVal = JSON.parse(result);
			val        = rawVal[self.valueField];
		}
		
		//make call back
		cb(null, val);
	});
};

CacheEntityService.prototype.set = function(key, value, cb) {
	var self = this;
	pb.cache.get(key, function(err, result){
		if (util.isError(err)) {
			cb(err, null);
			return;
		}
		
		//value doesn't exist in cache
		var val = null;
		if (self.valueField == null) {
			val = value;
		}
		else{
			var rawVal = null;
			if (result == null) {
				rawVal = {
					object_type: this.objType
				};
				rawVal[self.keyField]   = key;
			}
			else{
				rawVal = JSON.parse(result);
			}
			rawVal[self.valueField] = value;
			val                     = JSON.stringify(rawVal);
		}
		
		//set into cache
		pb.log.silly("Setting key ["+key+"] with value="+val+" VF="+self.valueField+" RES=["+result+"]");
		pb.cache.set(key, val, cb);
	});
};

CacheEntityService.prototype.purge = function(key, cb) {
	pb.cache.del(key, cb);
};

//exports
module.exports.CacheEntityService = CacheEntityService;