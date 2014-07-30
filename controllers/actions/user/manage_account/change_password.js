/*
    Copyright (C) 2014  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * Changes the logged in user's password
 */


//dependencies
var BaseController = pb.BaseController;
var FormController = pb.FormController;

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
            self.redirect('/user/change_password', cb);
        });
    });
};

//exports
module.exports = ChangePassword;
