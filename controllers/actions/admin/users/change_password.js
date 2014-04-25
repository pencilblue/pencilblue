/**
 * ChangePassword - Edits a user's password
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ChangePassword(){}

//inheritance
util.inherits(ChangePassword, pb.FormController);

ChangePassword.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var vars = this.pathVars;
	
	pb.utils.merge(vars, post);
    
    var message = this.hasRequiredParams(post, this.getRequiredFields());
    if(message) {
        this.formError(message, '/admin/users/change_password/' + post.id, cb);
        return;
    }
    
    if(self.session.authentication.user_id != vars.id) {
        this.formError(request, session, self.ls.get('INSUFFICIENT_CREDENTIALS'), '/admin/users/manage_users', cb);
        return;
    }
    
    if(post.new_password != post.confirm_password) {
        this.formError(self.ls.get('PASSWORD_MISMATCH'), '/admin/users/change_password/' + post.id, cb);
        return;
    }
    
    var dao = new pb.DAO();
    dao.loadById(post.id, 'user', function(err, user) {
        if(util.isError(err) || user == null) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/users/manage_users', cb);
            return;
        }
        
        pb.DocumentCreator.update(post, user);
        
        if(user.password != user.current_password) {
            self.formError(self.ls.get('INVALID_PASSWORD'), '/admin/users/change_password/' + post.id, cb);
            return;
        }
        
        user.password = user.new_password;
        delete user.new_password;
        delete user.current_password;
        
        dao.update(user).then(function(result) {
            if(util.isError(result)) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/users/edit_user?id=' + vars['id'], cb);
                return;
            }
            
            self.session.success = self.ls.get('PASSWORD_CHANGED');
            self.redirect(pb.config.siteRoot + '/admin/users/edit_user/' + user.id, cb);
        });
    });
};

ChangePassword.prototype.getRequiredFields = function() {
	return ['id', 'current_password', 'new_password', 'confirm_password'];
};

//exports
module.exports = ChangePassword;
