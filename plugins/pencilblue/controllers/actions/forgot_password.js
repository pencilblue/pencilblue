/*
    Copyright (C) 2015  PencilBlue, LLC

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

module.exports = function ForgotPasswordControllerModule(pb) {
    
    //pb dependencies
    var util = pb.util;

    /**
     * Sends a password reset email
     * @class ForgotPasswordController
     */
    function ForgotPasswordController(){}
    util.inherits(ForgotPasswordController, pb.FormController);

    /**
     * 
     * @method onPostParamsRetrieved
     * @param {Object} post
     * @param {Function} cb
     */
    ForgotPasswordController.prototype.onPostParamsRetrieved = function(post, cb) {
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
        var dao = new pb.SiteQueryService({site: self.site, onlyThisSite: true});
        dao.loadByValues(query, 'user', function(err, user) {
            if(util.isError(err) || user === null) {
                return self.formError(self.ls.get('NOT_REGISTERED'), returnURL, cb);
            }

            //verify that an email server was setup
            var settings = pb.SettingServiceFactory.getServiceBySite(self.site);
            settings.get('email_settings', function(err, emailSettings) {
                if (util.isError(err)) {
                    return self.formError(err.message, returnURL, cb);
                }
                else if (!emailSettings) {
                    return self.formError(self.ls.get('EMAIL_NOT_CONFIGURED'), returnURL, cb);
                }

                //find any existing password record for the user
                var userIdStr = user[pb.DAO.getIdField()].toString();
                dao.loadByValue('user_id', userIdStr, 'password_reset', function(err, passwordReset) {
                    if(util.isError(err)) {
                        return self.formError(err.message, returnURL, cb);
                    }

                    //create the password reset record
                    if(!passwordReset) {
                        passwordReset = pb.DocumentCreator.create('password_reset', {user_id: userIdStr});
                    }
                    passwordReset.verification_code = util.uniqueId();

                    //persist reset entry
                    dao.save(passwordReset, function(err, result) {
                        if(util.isError(err)) {
                            pb.log.error(err.stack);
                            return self.formError(self.ls.get('ERROR_SAVING'), returnURL, cb);
                        }

                        self.session.success = self.ls.get('YOUR_PASSWORD_RESET');
                        self.redirect(returnURL, cb);
                        var userService = new pb.UserService(self.getServiceContext());
                        userService.sendPasswordResetEmail(user, passwordReset, util.cb);
                    });
                });
            });
        });
    };

    //exports
    return ForgotPasswordController;
};
