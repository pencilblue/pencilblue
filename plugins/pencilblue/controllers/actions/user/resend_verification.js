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


module.exports = function ResendVerificationModule(pb) {

    //pb dependencies
    var util = pb.util;
    var UserService = pb.UserService;

    /**
     * Resends an account verification email
     * @class ResendVerification
     * @constructor
     */
    function ResendVerification(){}
    util.inherits(ResendVerification, pb.FormController);

    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    ResendVerification.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {

            /**
             * @property service
             * @type {UserService}
             */
            self.service = new UserService(self.getServiceContext());

            /**
             * @property dao
             * @type {DAO}
             */
            self.dao = new pb.SiteQueryService({site: self.site, onlyThisSite: true});

            cb(err, true);
        };
        ResendVerification.super_.prototype.init.apply(this, [context, init]);
    };

    ResendVerification.prototype.render = function(cb) {
        var self = this;
        var post = this.body;

        self.dao.loadByValue('email', post.email, 'user', function(err, user) {
            if(util.isError(err)) {
                return cb(err);
            }
            else if (!util.isNullOrUndefined(user)) {
                return self.formError(self.ls.g('users.USER_VERIFIED'), '/user/login', cb);
            }

            self.dao.loadByValue('email', post.email, 'unverified_user', function(err, user) {
                if(util.isError(err)) {
                    return cb(err);
                }
                else if(util.isNullOrUndefined(user)) {
                    return self.formError(self.ls.g('users.NOT_REGISTERED'), '/user/sign_up', cb);
                }

                user.verification_code = util.uniqueId();

                self.dao.save(user, function(err, result) {
                    if(util.isError(result)) {
                        return cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'))
                        });
                    }

                    cb({
                        content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.g('users.VERIFICATION_SENT') + user.email)
                    });
                    self.service.sendVerificationEmail(user, util.cb);
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
