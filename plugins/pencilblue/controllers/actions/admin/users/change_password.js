/*
    Copyright (C) 2016  PencilBlue, LLC

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
'use strict';

module.exports = function ChangePasswordModule(pb) {

    //pb dependencies
    var util = pb.util;
    var BaseAdminController = pb.BaseAdminController;

    /**
     * Changes a user's password
     */
    function ChangePassword(){}
    util.inherits(ChangePassword, BaseAdminController);

    ChangePassword.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        this.getJSONPostParams(function(err, post) {
            var message = self.hasRequiredParams(post, self.getRequiredFields());
            if(message) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
                });
                return;
            }

            if(self.session.authentication.user_id !== vars.id) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INSUFFICIENT_CREDENTIALS'))
                });
                return;
            }

            if(post.new_password !== post.confirm_password) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('users.PASSWORD_MISMATCH'))
                });
                return;
            }

            self.siteQueryService.loadById(vars.id, 'user', function(err, user) {
                if(util.isError(err) || user === null) {
                    if (err) { pb.log.error(JSON.stringify(err)); }
                    cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INVALID_UID'))
                    });
                    return;
                }

                if(user.password !== pb.security.encrypt(post.current_password)) {
                    cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('users.INVALID_PASSWORD'))
                    });
                    return;
                }

                user.password = pb.security.encrypt(post.new_password);
                pb.DocumentCreator.update(post, user);
                delete user.new_password;
                delete user.current_password;

                self.siteQueryService.save(user, function(err/*, result*/) {
                    if(util.isError(err)) {
                        if (err) { pb.log.error(JSON.stringify(err)); }
                        return cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'))
                        });
                    }

                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.g('users.PASSWORD_CHANGED'))});
                });
            });
        });
    };

    ChangePassword.prototype.getRequiredFields = function() {
        return ['current_password', 'new_password', 'confirm_password'];
    };

    //exports
    return ChangePassword;
};
