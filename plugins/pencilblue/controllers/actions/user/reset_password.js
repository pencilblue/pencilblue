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

//dependencies
var async = require('async');

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;
    var BaseController = pb.BaseController;
    var UserService = pb.UserService;
    var SiteService = pb.SiteService;
    var EmailService = pb.EmailService;
    var PasswordResetService = pb.PasswordResetService;

    /**
     * Resets the logged in user's password
     * @class ResetPassword
     * @constructor
     */
    function ResetPassword(){}
    util.inherits(ResetPassword, BaseController);

    /**
     * @method initSync
     * @param {object} context
     */
    ResetPassword.prototype.initSync = function(/*context*/) {

        /**
         * @property userService
         * @type {UserService}
         */
        this.userService = new UserService(this.getServiceContext());

        var ctx = this.getServiceContext();
        ctx.userService = this.userService;
        ctx.siteService = new SiteService(this.getServiceContext());
        ctx.emailService = new EmailService(this.getServiceContext());

        /**
         * @property passwordResetService
         * @type {PasswordResetService}
         */
        this.passwordResetService = new PasswordResetService(ctx);
    };

    ResetPassword.prototype.render = function(cb) {
        var self = this;
        var get  = this.query;

        //ensure we were passed the correct parameters
        if(this.hasRequiredParams(get, ['email', 'code'])) {
            return this.formError(self.ls.g('users.INVALID_VERIFICATION'), '/user/login', cb);
        }

        //retrieve the user
        var tasks = {
            user: util.wrapTask(this.userService, this.userService.getSingle, [{where: {email: this.query.email}}]),
            passwordReset: ['user', function(callback, data) {

                //when no reset is found short circuit the whole thing
                if (!data.user) {
                    self.formError(self.ls.g('users.INVALID_VERIFICATION'), '/user/login', cb);
                }
                self.passwordResetService.getSingle({where: {userId: data.user.id + '', verificationCode: self.query.code}}, callback);
            }],
            deletePasswordReset: ['user', 'passwordReset', function(callback, data) {

                //when no reset is found short circuit the whole thing
                if (!data.passwordReset) {
                    return self.formError(self.ls.g('users.INVALID_VERIFICATION'), '/user/login', cb);
                }
                self.passwordResetService.deleteSingle({where: {verificationCode: data.passwordReset.verificationCode}}, callback);
            }]
        };
        async.auto(tasks, function(err, data) {

            //log the user in
            self.session.authentication.user        = data.user;
            self.session.authentication.user_id     = data.user.id;
            self.session.authentication.admin_level = data.user.admin;
            self.session.authentication.reset_password = true;

            //redirect to change password
            self.redirect('/user/change_password', cb);
        });
    };

    //exports
    return ResetPassword;
};
