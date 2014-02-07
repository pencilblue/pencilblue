/**
 * DBEntityService - in cache storage
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function DBEntityService(objType, valueField, keyField){
	this.type       = 'DB';
	this.objType    = objType;
	this.keyField   = keyField;
	this.valueField = valueField ? valueField : null;
}

DBEntityService.prototype.get = function(key, cb){
	var dao              = new pb.DAO();
	var where            = {};
	where[this.keyField] = key;
	
	var self = this;
	dao.query(this.objType, where).then(function(result){
		if (util.isError(result)) {
			cb(result, null);
			return;
		}
		
		//ensure setting exists
		if (result.length == 0){
			cb(null, null);
			return;
		}

		//get setting
		var entity = result[0];
		var val    = self.valueField == null ? entity : entity[self.valueField];
		
		//callback with the result
		cb(null, val);
	});
};

DBEntityService.prototype.set = function(key, value, cb) {
	var dao              = new pb.DAO();
	var where            = {};
	where[this.keyField] = key;
	
	var self = this;
	dao.query('setting', where).then(function(result){
		if (util.isError(result)) {
			cb(result, null);
			return;
		}
		
		//value doesn't exist in cache
		var val = null;
		if (self.valueField == null) {
			val = value;
		}
		else{
			var rawVal = null;
			if (result == null || result.length == 0) {
				rawVal = {
					object_type: self.objType
				};
				rawVal[self.keyField]   = key;
			}
			else{
				rawVal = result[0];
			}
			rawVal[self.valueField] = value;
			val                     = rawVal;
		}
		
		//set into cache
		dao.update(val).then(function(result){
			if (util.isError(result)) {
				cb(result, null);
			}
			else{
				cb(null, result);
			}
		});
	});
};

DBEntityService.prototype.purge = function(key, cb) {
	var dao              = new pb.DAO();
	var where            = {};
	where[this.keyField] = key;
	dao.deleteMatching(where, this.objType).then(function(result){
		if (util.isError(result)) {
			cb(result, null);
		}
		else{
			cb(null, result);
		}
	});
};

//exports
module.exports.DBEntityService = DBEntityService;