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
 * Resends an account verification email
 */

function ResendVerification(){}

//inheritance
util.inherits(ResendVerification, pb.FormController);

ResendVerification.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;

	var message = this.hasRequiredParams(post, this.getRequiredFields());
	if(message) {
        self.formError(message, '/user/resend_verification', cb);
        return;
    }

	var dao = new pb.DAO();
	dao.loadByValue('email', post.email, 'user', function(err, user) {
        if(util.isError(err) || user === null) {
            self.formError(self.ls.get('USER_VERIFIED'), '/user/login', cb);
            return;
        }

        dao.loadByValue('email', post.email, 'unverified_user', function(err, user) {
        	if(util.isError(err) || user === null) {
                self.formError(self.ls.get('NOT_REGISTERED'), '/user/sign_up', cb);
                return;
            }

           user.verification_code = pb.utils.uniqueId();

           dao.update(user).then(function(result) {
                if(util.isError(result)) {
                    self.formError(self.ls.get('ERROR_SAVING'), '/user/resend_verification', cb);
                    return;
                }

                self.session.success = self.ls.get('VERIFICATION_SENT') + user.email;
                self.redirect('/user/verification_sent', cb);
                pb.users.sendVerificationEmail(user, pb.utils.cb);
            });
        });
    });
};

ResendVerification.prototype.getRequiredFields = function() {
	return ['email'];
};

//exports
module.exports = ResendVerification;
