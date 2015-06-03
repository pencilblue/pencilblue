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


module.exports = function ResendVerificationModule(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Resends an account verification email
     */
    function ResendVerification(){}
    util.inherits(ResendVerification, pb.FormController);

    ResendVerification.prototype.onPostParamsRetrieved = function(post, cb) {
        var self = this;

        var message = this.hasRequiredParams(post, this.getRequiredFields());
        if(message) {
            self.formError(message, '/user/resend_verification', cb);
            return;
        }

        var siteQueryService = new pb.SiteQueryService(self.site, true);
        siteQueryService.loadByValue('email', post.email, 'user', function(err, user) {
            if(util.isError(err) || user === null) {
                self.formError(self.ls.get('USER_VERIFIED'), '/user/login', cb);
                return;
            }

            siteQueryService.loadByValue('email', post.email, 'unverified_user', function(err, user) {
                if(util.isError(err) || user === null) {
                    self.formError(self.ls.get('NOT_REGISTERED'), '/user/sign_up', cb);
                    return;
                }

               user.verification_code = util.uniqueId();

               siteQueryService.save(user, function(err, result) {
                    if(util.isError(result)) {
                        self.formError(self.ls.get('ERROR_SAVING'), '/user/resend_verification', cb);
                        return;
                    }

                    self.session.success = self.ls.get('VERIFICATION_SENT') + user.email;
                    self.redirect('/user/verification_sent', cb);
                    var userService = new UserService(self.site);
                    userService.sendVerificationEmail(user, util.cb);
                });
            });
        });
    };

    ResendVerification.prototype.getRequiredFields = function() {
        return ['email'];
    };

    //exports
    return ResendVerification;
};
