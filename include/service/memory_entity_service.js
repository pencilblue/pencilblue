/**
 * MemoryEntityService - in memeory storage
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function MemoryEntityService(objType, valueField, keyField){
	this.type       = 'Memory';
	this.objType    = objType;
	this.keyField   = keyField;
	this.valueField = valueField ? valueField : null;
	this.storage    = {};
}

MemoryEntityService.prototype.get = function(key, cb){
	var rawVal = null;
	if (this.storage.hasOwnProperty(key)) {
		rawVal = this.storage[key];
	}
	
	//value not found
	if (rawVal == null) {
		cb(null, null);
		return;
	}
	
	var value = null;
	if (this.valueField == null) {
		value = rawValue;
	}
	else {
		value = rawValue[this.valueField];
	}
	cb(null, value);
};

MemoryEntityService.prototype.set = function(key, value, cb) {
	
	var rawValue = null;
	if (this.storage.hasOwnProperty(key)) {
		rawValue = this.storage[key];
		if (this.valueField == null) {
			rawValue = value;
		}
		else {
			rawValue[this.valueField] = value;
		}
	}
	else if (this.valueField == null){
		rawValue = value;
	}
	else{
		rawValue = {
			object_type: this.objType
		};
		rawValue[this.keyField]   = key;
		rawValue[this.valueField] = value;
	}
	this.storage[key] = rawValue;
	cb(null, true);
};

MemoryEntityService.prototype.purge = function(key, cb) {
	var exists = this.storage.hasOwnProperty(key);
	if(exists) {
		delete this.storage[key];
	}
	cb(null, exists);
};

//exports
module.exports.MemoryEntityService = MemoryEntityService;