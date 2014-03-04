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
	var self = this;
	
	this.setFormFieldValues(this.session.authentication.user);
    this.session.account_subsection = 'change_password';
    
    pb.templates.load('user/manage_account/change_password', null, null, function(data) {
        var result = '' + data;
        
        self.displayErrorOrSuccess(result, function(newResult) {
            result = newResult;
        
            var content = self.localizationService.localize(['users'], result);
            cb({content: content});
        });
    });
};

//exports
module.exports = ChangePassword;
