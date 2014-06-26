/**
 * ResetPassword - Creates a verified user
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ResetPassword(){}

//inheritance
util.inherits(ResetPassword, pb.BaseController);

ResetPassword.prototype.render = function(cb) {
	var self = this;
	var get  = this.query;
console.log(util.inspect(get));
    if(this.hasRequiredParams(get, ['email', 'code'])) {
        this.formError(self.ls.get('INVALID_VERIFICATION'), '/user/login', cb);
        return;
    }

    var dao = new pb.DAO();
    dao.loadByValue('email', get.email, 'user', function(err, user) {
        if(user == null) {
            self.formError(self.ls.get('INVALID_VERIFICATION'), '/user/login', cb);
            return;
        }

        dao.loadByValue('user_id', user._id.toString(), 'password_reset', function(err, passwordReset) {
            if(passwordReset == null) {
                self.formError(self.ls.get('INVALID_VERIFICATION'), '/user/login', cb);
                return;
            }

            if(get.code !== passwordReset.verification_code) {
                self.formError(self.ls.get('INVALID_VERIFICATION'), '/user/login', cb);
                return;
            }

            // delete the password reset token
            dao.deleteById(passwordReset._id, 'password_reset').then(function(result)  {
        	    //log the user in
                self.session.authentication.user        = user;
                self.session.authentication.user_id     = user._id.toString();
                self.session.authentication.admin_level = user.admin;

                //redirect to change password
                if(user.admin > 0) {
                    location = '/admin/users/change_password/' + user._id;
                }
                else {
                    location = '/user/manage_account/change_password';
                }
                self.redirect(location, cb);
            });
        });
    });
};

//exports
module.exports = ResetPassword;
