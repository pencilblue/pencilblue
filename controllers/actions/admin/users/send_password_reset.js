/**
 * SendPasswordReset - Creates a user and sends a confirmation email, if 
 * necessary
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function SendPasswordReset(){}

//inheritance
util.inherits(SendPasswordReset, pb.FormController);

SendPasswordReset.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var vars = this.pathVars;
	
	var message = this.hasRequiredParams(vars, ['id']);
	if(message) {
        self.formError(message, '/admin/users/manage_users', cb);
        return;
    }
    
	var dao = new pb.DAO();
	dao.loadById(vars['id'], 'user', function(err, user) {
        if(util.isError(err) || user == null) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/users/manage_users', cb);
            return;
        }
        
        dao.loadByValue('user_id', vars['id'], 'password_reset', function(err, passwordReset) {
        	if(util.isError(err)) {
                self.formError(self.ls.get('NOT_REGISTERED'), '/admin/users/edit_user/' + vars['id'], cb);
                return;
            }
            
            if(!passwordReset) {
                passwordReset = pb.DocumentCreator.create('password_reset', {user_id: user._id.toString()});
            }
            
            passwordReset.verification_code = pb.utils.uniqueId().toString();
           
                
            dao.update(passwordReset).then(function(result) {
                if(util.isError(result)) {
                    self.formError(self.ls.get('ERROR_SAVING'), '/admin/users/edit_user/' + vars['id'], cb);
                    return;
                }
                
                self.session.success = self.ls.get('VERIFICATION_SENT') + ' ' + user.email;
                cb(pb.RequestHandler.generateRedirect('/admin/users/edit_user/' + vars['id']));
                pb.users.sendPasswordResetEmail(user, pb.utils.cb);
            });
        });
    });
};

//exports
module.exports = SendPasswordReset;
