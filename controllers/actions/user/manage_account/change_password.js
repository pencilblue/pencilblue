/**
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */

//dependencies
var BaseController = pb.BaseController;
var FormController = pb.FormController;

/**
 * ChangePassword - Edit a user password
 *
 */
function ChangePassword(){}

//inheritance
util.inherits(ChangePassword, FormController);

ChangePassword.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;

    //sanitize
    post.current_password = BaseController.sanitize(post.current_password);
    post.new_password     = BaseController.sanitize(post.new_password);
    post.confirm_password = BaseController.sanitize(post.confirm_password);

    //validate
	var message = this.hasRequiredParams(post, ['current_password', 'new_password', 'confirm_password']);
	if(message) {
        this.formError(message, '/user/manage_account', cb);
        return;
    }

    var where = {
		_id: ObjectID(self.session.authentication.user._id),
		password: pb.security.encrypt(post.current_password)
	};
    delete post.current_password;

    if(post.new_password !== post.confirm_password) {
        self.formError(self.ls.get('PASSWORD_MISMATCH'), '/user/change_password', cb);
        return;
    }

    post.password = post.new_password;
    delete post.new_password;
    delete post.confirm_password;

    var dao = new pb.DAO();
    dao.loadByValues(where, 'user', function(err, user) {
        if(util.isError(err) || user === null) {
            self.formError(self.ls.get('INVALID_PASSWORD'), '/user/change_password', cb);
            return;
        }

        pb.DocumentCreator.update(post, user);
        dao.update(user).then(function(result) {
            if(util.isError(result)) {
                self.formError(self.ls.get('ERROR_SAVING'), '/user/change_password', cb);
                return;
            }

            self.session.success = self.ls.get('PASSWORD_CHANGED');
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/user/change_password'));
        });
    });
};

//exports
module.exports = ChangePassword;
