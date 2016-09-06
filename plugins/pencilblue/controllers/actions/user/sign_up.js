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

//dependencies
var async = require('async');

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;
    var BaseController = pb.BaseController;
    var FormController = pb.FormController;
    var UserService = pb.UserService;

    /**
     * Creates an READER level user
     * @class SignUp
     * @constructor
     */
    function SignUp(){}
    util.inherits(SignUp, FormController);

    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    SignUp.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {

            /**
             * @property dao
             * @type {DAO}
             */
            self.dao = new pb.SiteQueryService({site: self.site, onlyThisSite: false});

            /**
             * @property contentService
             * @type {ContentService}
             */
            self.contentService = new pb.ContentService({site: self.site});

            /**
             * @property service
             * @type {UserService}
             */
            self.service = new UserService(self.getServiceContext());

            cb(err, true);
        };
        SignUp.super_.prototype.init.apply(this, [context, init]);
    };

    SignUp.prototype.render = function(cb) {
        var self = this;
        var post = this.body;
        post.position   = '';
        post.photo      = null;
        post.admin      = pb.SecurityService.ACCESS_USER;
        post.username   = BaseController.sanitize(post.username);
        post.email      = BaseController.sanitize(post.email);
        post.first_name = BaseController.sanitize(post.first_name);
        post.last_name  = BaseController.sanitize(post.last_name);
        var message = self.hasRequiredParams(post, self.getRequiredFields());
        if(message) {
            return cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
            });
        }

        self.contentService.getSettings(function(err, contentSettings) {
            if (util.isError(err)){
                pb.log.error("ContentService.getSettings encountered an error. ERROR[%s]", err.stack);
                return cb({
                    code: 500,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, err)
                });
            }

            var collection      = 'user';
            var successRedirect = '/user/login';
            var successMsg      = self.ls.g('login.ACCOUNT_CREATED');
            if(contentSettings.require_verification) {
                collection      = 'unverified_user';
                successRedirect = '/user/verification_sent';
                successMsg      = self.ls.g('users.VERIFICATION_SENT') + post.email;
                post.verification_code = util.uniqueId();
            }

            var user = pb.DocumentCreator.create(collection, post);

            self.validateUniques(user, function(err, results) {
                if(util.isError(err)) {
                    return cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('users.EXISTING_USERNAME'))
                    });
                }

                //check for validation failures
                var errMsg = null;
                if (results.verified_username > 0 || results.unverified_username > 0) {
                    errMsg = self.ls.g('users.EXISTING_USERNAME');
                }
                else if (results.verified_email > 0 || results.unverified_email > 0) {
                    errMsg = self.ls.g('users.EXISTING_EMAIL');
                }

                // Handle error
                if (errMsg) {
                    return cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, errMsg)
                    });
                }
                self.dao.save(user, function(err, data) {
                    if(util.isError(err)) {
                        return cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'))
                        });
                    }

                    cb({
                        content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, successMsg)
                    });
                });

                //send email for verification when required
                if (contentSettings.require_verification) {
                    self.service.sendVerificationEmail(user, util.cb);
                }
            });
        });
    };

    SignUp.prototype.getRequiredFields = function() {
        return ['username', 'email', 'password', 'confirm_password'];
    };

    /**
     * @method validateUniques
     * @param {Object} user
     * @param {Function} cb
     */
    SignUp.prototype.validateUniques = function(user, cb) {
        var self = this;
        var tasks = {
            verified_username: function(callback) {
                self.dao.count('user', {username: user.username}, callback);
            },
            verified_email: function(callback) {
                self.dao.count('user', {email: user.email}, callback);
            },
            unverified_username: function(callback) {
                self.dao.count('unverified_user', {username: user.username}, callback);
            },
            unverified_email: function(callback) {
                self.dao.count('unverified_user', {email: user.email}, callback);
            }
        };
        async.series(tasks, cb);
    };

    //exports
    return SignUp;
};
