/**
 * UserService - Service for performing user specific operation.  
 *
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue 2014, All Rights Reserved
 */
function UserService(){}

UserService.prototype.getFullName = function(userId, cb) {
	var dao = new pb.DAO();
	dao.loadById('user', userId, function(err, author){
		if (util.isError(err)) {
			callback(err, null);
			return;
		}

		cb(null, author.first_name + ' ' + author.last_name);
	});
};

UserService.prototype.getAuthors = function(objArry, cb){
	var self  = this;
	var tasks = pb.utils.getTasks(objArry, function(objArry, index){
    	return function(callback) {
    		self.getFullName(objArry[index].author, function(err, fullName){
    			objArry[index].author_name = fullName;
    			callback(err, objArry[index]);
    		});
    	};
    });
    async.parallelLimit(tasks, 3, cb);
};

//exports
module.exports.UserService = UserService;