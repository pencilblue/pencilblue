/**
 * ResendVerification - Creates a user and sends a confirmation email, if 
 * necessary
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ResendVerification(){}

//inheritance
util.inherits(ResendVerification, pb.FormController);

ResendVerification.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	
	var message = this.hasRequiredParams(post, this.getRequiredFields());
	if(message) {
        self.formError(message, '/user/resend_verification', cb);
        return;
    }
    
	var dao = new pb.DAO();
	dao.loadByValue('email', post.email, 'user', function(err, user) {
        if(util.isError(err) || user == null) {
            self.formError('^loc_USER_VERIFIED^', '/user/login', cb);
            return;
        }
        
        dao.loadByValue('email', post.email, 'unverified_user', function(err, user) {
        	if(util.isError(err) || user == null) {
                self.formError('^loc_NOT_REGISTERED^', '/user/sign_up', cb);
                return;
            }
            
           user.verification_code = uniqueID();
                
           dao.update(user).then(function(result) {
                if(util.isError(result)) {
                    self.formError('^loc_ERROR_SAVING^', '/user/resend_verification', cb);
                    return;
                }
                
                self.sendVerificationEmail(user, pb.utils.cb);
                self.session.success = '^loc_VERIFICATION_SENT^' + user.email;
                cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/user/verification_sent'));
            });
        });
    });
};

ResendVerification.prototype.getRequiredFields = function() {
	return ['email'];
};

ResendVerification.prototype.sendVerificationEmail = function(user, cb) {
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
};

//exports
module.exports = ResendVerification;
