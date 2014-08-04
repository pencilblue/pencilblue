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
 * Creates a new user
 */

function NewUser(){}

//inheritance
util.inherits(NewUser, pb.FormController);

NewUser.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;

	post.photo = post.uploaded_image;
    delete post.uploaded_image;
    delete post.image_url;

    var message = this.hasRequiredParams(post, this.getRequiredFields());
    if(message) {
        this.formError(message, '/admin/users/new_user', cb);
        return;
    }

    if(!pb.security.isAuthorized(this.session, {admin_level: post.admin})) {
        this.formError(self.ls.get('INSUFFICIENT_CREDENTIALS'), '/admin/users/new_user', cb);
        return;
    }

    var user = pb.DocumentCreator.create('user', post);
    pb.users.isUserNameOrEmailTaken(user.username, user.email, post.id, function(err, isTaken) {
        if(util.isError(err) || isTaken) {
            self.formError(self.ls.get('EXISTING_USERNAME'), '/admin/users/new_user', cb);
            return;
        }

        var dao = new pb.DAO();
        dao.update(user).then(function(result) {
            if(util.isError(result)) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/users/new_user', cb);
                return;
            }

            self.session.success = self.ls.get('USER_CREATED');
            self.redirect('/admin/users/manage_users', cb);
        });
    });
};

NewUser.prototype.getRequiredFields = function() {
	return ['username', 'email', 'password', 'confirm_password', 'admin'];
};

//exports
module.exports = NewUser;
