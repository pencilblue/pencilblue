/**
 * JSONEntityService - in cache storage
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function JSONFSEntityService(objType){
	this.type       = 'JSONFS';
	this.objType    = objType;
}

//inheritance
util.inherits(JSONFSEntityService, pb.FSEntityService);

JSONFSEntityService.prototype.get = function(key, cb){
	var handler = function(err, value) {
		if (util.isError(err)) {
			cb(err, null);
			return;
		}
		
		try {
			cb(null, JSON.parse(value));
		}
		catch(e) {
			var error = this.type+": Failed to parse JSON from file: "+key;
			pb.log.error(error);
			cb(new PBError(error).setSource(e), null);
		}
	};
	JSONFSEntityService.super_.prototype.render.apply([this, key, handler]);
};

JSONFSEntityService.prototype.set = function(key, value, cb) {
	if (!pb.utils.isObject(value) && !util.isArray(value)) {
		cb(new PBError(this.type+": Value must be an array or object: "+util.inspect(value)), null);
	}
	
	try {
		value = JSON.stringify(value);
	}
	catch(e) {
		cb(e, null);
		return;
	}
	fs.writeFile(key, value, {encoding: "UTF-8"}, cb);
};

JSONFSEntityService.prototype.purge = function(key, cb) {
	fs.unlink(key, cb);
};

//exports
module.exports.JSONFSEntityService = JSONFSEntityService;