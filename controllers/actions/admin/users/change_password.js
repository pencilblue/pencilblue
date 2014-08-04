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
 * Changes a user's password
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
        if(util.isError(err) || user === null) {
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
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/users/edit_user/' + vars.id, cb);
                return;
            }

            self.session.success = self.ls.get('PASSWORD_CHANGED');
            self.redirect('/admin/users/edit_user/' + user.id, cb);
        });
    });
};

ChangePassword.prototype.getRequiredFields = function() {
	return ['id', 'current_password', 'new_password', 'confirm_password'];
};

//exports
module.exports = ChangePassword;
