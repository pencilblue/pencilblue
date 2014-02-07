/**
 * FSEntityService - in cache storage
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function FSEntityService(objType){
	this.type       = 'FS';
	this.objType    = objType;
}

FSEntityService.prototype.get = function(key, cb){
	fs.readFile(key, {encoding: "UTF-8"}, function(err, result){
		if (util.isError(err)) {
			cb(err, null);
			return;
		}
		
		//make call back
		cb(null, result);
	});
};

FSEntityService.prototype.set = function(key, value, cb) {
	fs.writeFile(key, value, {encoding: "UTF-8"}, cb);
};

FSEntityService.prototype.purge = function(key, cb) {
	fs.unlink(key, cb);
};

//exports
module.exports.FSEntityService = FSEntityService;