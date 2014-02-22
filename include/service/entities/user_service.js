/**
 * UserService - Service for performing user specific operation.  
 *
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue 2014, All Rights Reserved
 */
function UserService(){}

UserService.prototype.getFullName = function(userId, cb) {
	var dao = new pb.DAO();
	dao.loadById(userId, 'user', function(err, author){
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

UserService.prototype.sendVerificationEmail = function(user, cb) {
	cb = cb || pb.utils.cb;
	
	var options = {
		to: user.email,
		subject: 'pencilblue Account Confirmation',
		template: 'admin/elements/default_verification_email',
		replacements: {
			'^verification_url^': pb.config.siteRoot + '/actions/user/verify_email?email=' + user.email + '&code=' + user.verification_code,
			'^first_name^': user.first_name,
			'^last_name^': user.last_name
		}
	};
	pb.sendFromTemplate(options, cb);
}

//exports
module.exports.UserService = UserService;