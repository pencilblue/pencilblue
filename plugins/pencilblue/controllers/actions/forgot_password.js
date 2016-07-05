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

module.exports = function ForgotPasswordControllerModule(pb) {

    //pb dependencies
    var util = pb.util;
    var UserService = pb.UserService;
    var SiteService = pb.SiteService;
    var EmailService = pb.EmailService;
    var PasswordResetService = pb.PasswordResetService;

    /**
     * Sends a password reset email
     * @class ForgotPasswordController
     */
    function ForgotPasswordController(){}
    util.inherits(ForgotPasswordController, pb.FormController);

    ForgotPasswordController.prototype.initSync = function(/*context*/) {

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

    /**
     * @method render
     * @param {Function} cb (Error|object)
     */
    ForgotPasswordController.prototype.render = function(cb) {
        var self = this;
        var returnURL = this.query.admin ? '/admin/login' : '/user/login';

        this.passwordResetService.addIfNotExists(this.body.username, function(err/*, wrapper*/) {
            if (util.isError(err)) {
                var msg = err.message;
                if (util.isArray(err.validationErrors)) {
                    msg = err.validationErrors[0].message;
                }
                return self.formError(self.ls.g('generic.ERROR_SAVING') + ': ' + msg, returnURL, cb);
            }

            self.session.success = self.ls.g('users.YOUR_PASSWORD_RESET');
            self.redirect(returnURL, cb);
        });
    };

    //exports
    return ForgotPasswordController;
};
