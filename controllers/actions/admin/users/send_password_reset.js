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
 * Sends a password reset email
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
	dao.loadById(vars.id, 'user', function(err, user) {
        if(util.isError(err) || user === null) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/users/manage_users', cb);
            return;
        }

        dao.loadByValue('user_id', vars.id, 'password_reset', function(err, passwordReset) {
        	if(util.isError(err)) {
                self.formError(self.ls.get('NOT_REGISTERED'), '/admin/users/edit_user/' + vars.id, cb);
                return;
            }

            if(!passwordReset) {
                passwordReset = pb.DocumentCreator.create('password_reset', {user_id: user._id.toString()});
            }

            passwordReset.verification_code = pb.utils.uniqueId().toString();

            dao.update(passwordReset).then(function(result) {
                if(util.isError(result)) {
                    self.formError(self.ls.get('ERROR_SAVING'), '/admin/users/edit_user/' + vars.id, cb);
                    return;
                }

                //send the user an email
                pb.users.sendPasswordResetEmail(user, passwordReset, function(err, response) {
                    if (util.isError(err)) {
                        return self.formError(self.ls.get(err.message), '/admin/users/edit_user/' + vars.id, cb);
                    }
                    
                    self.session.success = self.ls.get('VERIFICATION_SENT') + ' ' + user.email;
                    self.redirect('/admin/users/edit_user/' + vars.id, cb);
                });
            });
        });
    });
};

//exports
module.exports = SendPasswordReset;
