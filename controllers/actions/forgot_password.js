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

function ForgotPassword(){}

//inheritance
util.inherits(ForgotPassword, pb.FormController);

ForgotPassword.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;

	var returnURL = this.query.admin ? '/admin/login' : '/user/login';

	var message = this.hasRequiredParams(post, ['username']);
	if(message) {
        self.formError(message, '/admin/users/manage_users', cb);
        return;
    }

	var query = {
		object_type : 'user',
		$or : [
	        {
	        	username : post.username
	        },
	        {
	        	email : post.username
	        }
        ]
	};

	//search for user
	var dao = new pb.DAO();
	dao.loadByValues(query, 'user', function(err, user) {
        if(util.isError(err) || user === null) {
            self.formError(self.ls.get('NOT_REGISTERED'), returnURL, cb);
            return;
        }

        dao.loadByValue('user_id', user._id.toString(), 'password_reset', function(err, passwordReset) {
        	if(util.isError(err)) {
                self.formError(self.ls.get('NOT_REGISTERED'), returnURL, cb);
                return;
            }

            if(!passwordReset) {
                passwordReset = pb.DocumentCreator.create('password_reset', {user_id: user._id.toString()});
            }

            passwordReset.verification_code = pb.utils.uniqueId().toString();


            dao.update(passwordReset).then(function(result) {
                if(util.isError(result)) {
                    self.formError(self.ls.get('ERROR_SAVING'), returnURL, cb);
                    return;
                }

                self.session.success = self.ls.get('YOUR_PASSWORD_RESET');
                self.redirect(returnURL, cb);
                pb.users.sendPasswordResetEmail(user, passwordReset, pb.utils.cb);
            });
        });
    });
};

//exports
module.exports = ForgotPassword;
