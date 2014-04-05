/**
 * ChangePassword - Edit a user password
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ChangePassword(){}

//inheritance
util.inherits(ChangePassword, pb.FormController);

ChangePassword.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	
	var message = this.hasRequiredParams(post, ['old_password', 'password', 'confirm_password']);
	if(message) {
        this.formError(message, '/user/manage_account', cb);
        return;
    }
    
    var where = {
		_id: self.session.authentication.user._id, 
		password: pb.security.encrypt(post['old_password'])
	};        
    delete post['old_password'];
    
    var dao = new pb.DAO();
    dao.loadByValues(where, 'user', function(err, user) {
        if(util.isError(err) || user == null) {
            self.formError(self.ls.get('INVALID_PASSWORD'), '/user/manage_account', cb);
            return;
        }
        
        pb.DocumentCreator.update(post, user);
        dao.update(user).then(function(result) {
            if(util.isError(result)) {
                self.formError(self.ls.get('ERROR_SAVING'), '/user/manage_account', cb);
                return;
            }
            
            self.session.success = self.ls.get('PASSWORD_CHANGED');
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/user/manage_account'));
        });
    });
};

//exports
module.exports = ChangePassword;
