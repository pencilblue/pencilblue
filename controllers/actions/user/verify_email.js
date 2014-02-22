/**
 * VerifyEmail - Creates a verified user
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function VerifyEmail(){}

//inheritance
util.inherits(VerifyEmail, pb.BaseController);

VerifyEmail.prototype.render = function(cb) {
	var self = this;
	var get  = this.query;
    
    if(!this.hasRequiredParams(get, ['email', 'code'])) {
        this.formError('^loc_INVALID_VERIFICATION^', '/user/resend_verification', cb);
        return;
    }
    
    var dao = new pb.DAO();
    dao.count('user', {email: get.email}, function(err, count) {
        if(count > 0) {
            self.formError('^loc_USER_VERIFIED^', '/user/login', cb);
            return;
        }
        
        dao.loadByValue('email', get.email, 'unverified_user', function(err, unverifiedUser) {
            if(unverifiedUser == null) {
                self.formError('^loc_NOT_REGISTERED^', '/user/sign_up', cb);
                return;
            }
            
            if(unverifiedUser['verification_code'] != get['code']) {
                self.formError('^loc_INVALID_VERIFICATION^', '/user/resend_verification', cb);
                return;
            }
            
            dao.deleteById(unverifiedUser._id, 'unverified_user').then(function(result)  {
                //TODO handle error 
            	
            	//convert to user
            	var user = unverifiedUser;
                delete user._id;
                user.object_type = 'user';
                
                dao.update(user).then(function(result) {
                    if(util.isError(result))  {
                        self.formError('^loc_ERROR_SAVING^', '/user/sign_up', cb);
                        return;
                    }
                    
                    self.session.success = '^loc_EMAIL_VERIFIED^';
                    self.redirect(pb.config.siteRoot + '/user/login', cb);
                });
            });
        });
    });
};

//exports
module.exports = VerifyEmail;
