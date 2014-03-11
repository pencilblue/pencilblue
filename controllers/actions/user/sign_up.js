/**
 * SignUp - Creates a user and sends a confirmation email, if necessary
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function SignUp(){}

//inheritance
util.inherits(SignUp, pb.FormController);

SignUp.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	
	post['position'] = '';
    post['photo']    = null;
    post['admin']    = ACCESS_USER;
    
    var message = this.hasRequiredParams(post, this.getRequiredFields());
    if(message) {
        this.formError(message, '/user/sign_up', cb);
        return;
    }
    
    var dao = new pb.DAO();
    pb.content.getSettings(function(err, contentSettings) {
    	//TODO handle error
    	
    	var collection      = 'user';
    	var successRedirect = '/user/login';
    	var successMsg      = '^loc_ACCOUNT_CREATED^';
        if(contentSettings.require_verification) {
        	collection      = 'unverified_user';
        	successRedirect = '/user/verification_sent';
        	successMsg      = '^loc_VERIFICATION_SENT^' + post.email;
        	post['verification_code'] = pb.utils.uniqueId();
        }
        
        var user = pb.DocumentCreator.create(collection, post);
        
        self.validateUniques(user, function(err, results) {
            if(util.isError(err)) {
                self.formError('A general failure occurred', '/user/sign_up', cb);
                return;
            }
            
            //check for validation failures
            var errMsg = null;
            if (results.verified_username > 0 || results.unverified_username > 0) {
            	errMsg = '^loc_EXISTING_EMAIL^';
            }
            else if (results.verified_email > 0 || results.unverified_email > 0) {
            	errMsg = '^loc_EXISTING_EMAIL^';
            }
            
            if (errMsg) {
            	self.formError(errMsg, '/user/sign_up', cb);
                return;
            }
            
            dao.update(user).then(function(data) {
                if(util.isError(data)) {
                    self.formError(request, session, '^loc_ERROR_SAVING^', '/user/sign_up', cb);
                    return;
                }
                
                self.session.success = successMsg;
                self.redirect(pb.config.siteRoot + successRedirect, cb);
                
                //send email for verification when required
                if (contentSettings.require_verification) {
                	pb.users.sendVerificationEmail(user, pb.utils.cb);
                }
            });
        });
    });
};

SignUp.prototype.getRequiredFields = function() {
	return ['username', 'email', 'password', 'confirm_password'];
};

SignUp.prototype.validateUniques = function(user, cb) {
	var dao = new pb.DAO();
	var tasks = {
		verified_username: function(callback) {
			dao.count('user', {username: user.username}, callback);
		},
		verified_email: function(callback) {
			dao.count('user', {email: user.email}, callback);
		},
		unverified_username: function(callback) {
			dao.count('unverified_user', {username: user.username}, callback);
		},
		unverified_email: function(callback) {
			dao.count('unverified_user', {email: user.email}, callback);
		},
	};
	async.series(tasks, cb);
};

//exports
module.exports = SignUp;
