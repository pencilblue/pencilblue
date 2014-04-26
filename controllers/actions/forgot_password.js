/**
 * ForgotPassword - Creates a user and sends a confirmation email, if 
 * necessary
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ForgotPassword(){}

//inheritance
util.inherits(ForgotPassword, pb.FormController);

ForgotPassword.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	
	var returnURL = this.query['admin'] ? '/admin/login' : '/user/login';
	
	var message = this.hasRequiredParams(post, ['username']);
	if(message) {
        self.formError(message, '/admin/users/manage_users', cb);
        return;
    }
    
	var query = {
		object_type : 'user',
		$or : [ 
	        {
	        	username : post['username']
	        }, 
	        {
	        	email : post['username']
	        } 
        ]
	};
	
	//search for user
	var dao = new pb.DAO();
	dao.loadByValues(query, 'user', function(err, user) {
        if(util.isError(err) || user == null) {
            self.formError(self.ls.get('ERROR_SAVING'), returnURL, cb);
            return;
        }
        
        dao.loadByValue('user_id', user._id.toString(), 'password_reset', function(err, passwordReset) {
        	if(util.isError(err)) {
                self.formError(self.ls.get('NOT_REGISTERED'), returnURL, cb);
                return;
            }
            
            if(!passwordReset) {
                passwordReset = pb.DocumentCreator.create('password_reset', {user_id: user._id.toString()});
            }
            
            passwordReset.verification_code = pb.utils.uniqueId().toString();
           
                
            dao.update(passwordReset).then(function(result) {
                if(util.isError(result)) {
                    self.formError(self.ls.get('ERROR_SAVING'), returnURL, cb);
                    return;
                }
                
                self.session.success = self.ls.get('VERIFICATION_SENT') + ' ' + user.email;
                cb(pb.RequestHandler.generateRedirect(returnURL));
                pb.users.sendPasswordResetEmail(user, pb.utils.cb);
            });
        });
    });
};

//exports
module.exports = ForgotPassword;
