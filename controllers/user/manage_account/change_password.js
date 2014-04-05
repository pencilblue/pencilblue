/**
 * ChangePassword - Allows the user to change their password
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ChangePassword(){}

//inheritance
util.inherits(ChangePassword, pb.BaseController);

ChangePassword.prototype.render = function(cb) {
	
	this.setFormFieldValues(this.session.authentication.user);
    this.session.account_subsection = 'change_password';
    this.ts.load('user/manage_account/change_password', function(err, data) {
        cb({content: '' + data});
    });
};

//exports
module.exports = ChangePassword;
