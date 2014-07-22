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
 * Creates an READER level user
 */

//dependencies
var BaseController = pb.BaseController;
var FormController = pb.FormController;

function SignUp(){}

//inheritance
util.inherits(SignUp, FormController);

SignUp.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;

	post.position   = '';
    post.photo      = null;
    post.admin      = ACCESS_USER;
    post.username   = BaseController.sanitize(post.username);
    post.email      = BaseController.sanitize(post.email);
    post.first_name = BaseController.sanitize(post.first_name);
    post.last_name  = BaseController.sanitize(post.last_name);

    var message = this.hasRequiredParams(post, this.getRequiredFields());
    if(message) {
        this.formError(message, '/user/sign_up', cb);
        return;
    }

    var dao = new pb.DAO();
    pb.content.getSettings(function(err, contentSettings) {
    	//TODO handle error

    	var collection      = 'user';
    	var successRedirect = '/user/login';
    	var successMsg      = self.ls.get('ACCOUNT_CREATED');
        if(contentSettings.require_verification) {
        	collection      = 'unverified_user';
        	successRedirect = '/user/verification_sent';
        	successMsg      = self.ls.get('VERIFICATION_SENT') + post.email;
        	post.verification_code = pb.utils.uniqueId();
        }

        var user = pb.DocumentCreator.create(collection, post);

        self.validateUniques(user, function(err, results) {
            if(util.isError(err)) {
                self.formError('A general failure occurred', '/user/sign_up', cb);
                return;
            }

            //check for validation failures
            var errMsg = null;
            if (results.verified_username > 0 || results.unverified_username > 0) {
            	errMsg = self.ls.get('EXISTING_EMAIL');
            }
            else if (results.verified_email > 0 || results.unverified_email > 0) {
            	errMsg = self.ls.get('EXISTING_EMAIL');
            }

            if (errMsg) {
            	self.formError(errMsg, '/user/sign_up', cb);
                return;
            }

            dao.update(user).then(function(data) {
                if(util.isError(data)) {
                    self.formError(request, session, self.ls.get('ERROR_SAVING'), '/user/sign_up', cb);
                    return;
                }

                self.session.success = successMsg;
                self.redirect(successRedirect, cb);

                //send email for verification when required
                if (contentSettings.require_verification) {
                	pb.users.sendVerificationEmail(user, pb.utils.cb);
                }
            });
        });
    });
};

SignUp.prototype.getRequiredFields = function() {
	return ['username', 'email', 'password', 'confirm_password'];
};

SignUp.prototype.validateUniques = function(user, cb) {
	var dao = new pb.DAO();
	var tasks = {
		verified_username: function(callback) {
			dao.count('user', {username: user.username}, callback);
		},
		verified_email: function(callback) {
			dao.count('user', {email: user.email}, callback);
		},
		unverified_username: function(callback) {
			dao.count('unverified_user', {username: user.username}, callback);
		},
		unverified_email: function(callback) {
			dao.count('unverified_user', {email: user.email}, callback);
		},
	};
	async.series(tasks, cb);
};

//exports
module.exports = SignUp;
