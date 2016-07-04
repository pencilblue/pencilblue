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
var util = require('../../util.js');
var async = require('async');

module.exports = function(pb) {

    //pb dependencies
    var DAO = pb.DAO;
    var BaseObjectService = pb.BaseObjectService;
    var ValidationService = pb.ValidationService;
    var UrlService = pb.UrlService;
    var SiteService = pb.SiteService;

    /**
     * @private
     * @static
     * @readonly
     * @property TYPE
     * @type {String}
     */
    var TYPE = 'password_reset';

    /**
     * Provides interactions with topics
     * @class PasswordResetService
     * @extends BaseObjectService
     * @constructor
     * @param {Object} context
     * @param {string} context.site
     * @param {boolean} context.onlyThisSite
     * @param {UserService} context.userService
     * @param {SiteService} context.siteService
     * @param {EmailService} context.emailService
     */
    function PasswordResetService(context) {
        if (!util.isObject(context)) {
            context = {};
        }

        /**
         * @property userService
         * @type {UserService}
         */
        this.userService = context.userService;

        /**
         * @property siteService
         * @type {SiteService}
         */
        this.siteService = context.siteService;

        /**
         * @property emailService
         * @type {EmailService}
         */
        this.emailService = context.emailService;

        context.type = TYPE;
        PasswordResetService.super_.call(this, context);
    }
    util.inherits(PasswordResetService, BaseObjectService);

    /**
     * @method addIfNotExists
     * @param {string} usernameOrEmail
     * @param {function} cb (Error, {created: boolean, data: {}})
     */
    PasswordResetService.prototype.addIfNotExists = function(usernameOrEmail, cb) {
        var self = this;

        //retrieve the user
        this.userService.getByUsernameOrEmail(usernameOrEmail, {}, function(err, userObj) {
            if (util.isError(err)) {
                return cb(err);
            }
            if (util.isNullOrUndefined(userObj)) {
                return cb(BaseObjectService.notFound());
            }

            //attempt to retrieve any existing reset
            self.getSingle({where: {userId: userObj.id}}, function(err, passwordResetObj) {
                if (util.isError(err)) {
                    return cb(err);
                }

                //need to know if we should create the DTO or not
                var created = !passwordResetObj;
                if (created) {
                    passwordResetObj = {userId: userObj.id};
                }

                //now persist it back
                self.save(passwordResetObj, function(err, persistedPasswordReset) {
                    if (util.isError(err)) {
                        return cb(err);
                    }

                    //now attempt to send the notification
                    self.sendPasswordResetEmail(userObj, persistedPasswordReset, function(err) {
                        cb(err, {
                            created: created,
                            data: persistedPasswordReset
                        });
                    });
                });
            });
        });
    };

    /**
     * Sends a password reset email to a user
     * @method sendPasswordResetEmail
     * @param {object} user A user object
     * @param {object} passwordReset A password reset object containing the verification code
     * @param {function} cb (Error)
     */
    PasswordResetService.prototype.sendPasswordResetEmail = function(user, passwordReset, cb) {
        var self = this;

        var tasks = [
            util.wrapTask(this.siteService, this.siteService.getByUid, [this.context.site]),
            function(siteInfo, callback) {
                var root = SiteService.getHostWithProtocol(siteInfo.hostname);
                var verificationUrl = UrlService.urlJoin(root, '/actions/user/reset_password') +
                    util.format('?email=%s&code=%s', encodeURIComponent(user.email), encodeURIComponent(passwordReset.verificationCode));

                var options = {
                    to: user.email,
                    subject: siteInfo.displayName + ' Password Reset',
                    template: 'admin/elements/password_reset_email',
                    replacements: {
                        'verification_url': verificationUrl,
                        'first_name': user.first_name,
                        'last_name': user.last_name
                    }
                };
                self.emailService.sendFromTemplate(options, callback);
            }
        ];
        async.waterfall(tasks, cb);
    };

    /**
     * @method validate
     * @param context
     * @param {object} context.data
     * @param {Array} context.validationErrors
     * @param {function} cb
     * @returns {*}
     */
    PasswordResetService.prototype.validate = function(context, cb) {
        var tasks = [
            util.wrapTask(this, this.validateUserId, [context]),
            util.wrapTask(this, this.validateVerificationCode, [context])
        ];
        async.parallel(tasks, cb);
    };

    PasswordResetService.prototype.validateUserId = function(context, cb) {
        var obj = context.data;
        var errors = context.validationErrors;

        if (!ValidationService.isIdStr(obj.userId, true)) {
            errors.push(BaseObjectService.validationFailure('userId', 'The userId must be a valid string'));
            return cb();
        }

        var options = {
            where: DAO.getIdWhere(obj.userId)
        };
        this.userService.count(options, function(err, count) {
            if (count !== 1) {
                errors.push(BaseObjectService.validationFailure('userId', 'The userId must reference an existing user'));
            }
            cb(err);
        });
    };

    PasswordResetService.prototype.validateVerificationCode = function(context, cb) {
        var obj = context.data;
        var errors = context.validationErrors;

        if (!ValidationService.isNonEmptyStr(obj.verificationCode, true)) {
            errors.push(BaseObjectService.validationFailure('verificationCode', 'The verificationCode must be a non-empty string'));
            return cb();
        }

        var where = {
            verificationCode: obj.verificationCode
        };
        this.dao.unique(TYPE, where, obj[DAO.getIdField()], function(err, isUnique) {
            if (!isUnique) {
                errors.push(BaseObjectService.validationFailure('verificationCode', 'The verificationCode must be unique'));
            }
            cb(err);
        });
    };

    /**
     *
     * @static
     * @method
     * @param {Object} context
     * @param {PasswordResetService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    PasswordResetService.onFormat = function(context, cb) {
        var dto = context.data;
        dto.userId = BaseObjectService.sanitize(dto.userId);
        cb();
    };

    /**
     *
     * @static
     * @method
     * @param {Object} context
     * @param {PasswordResetService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    PasswordResetService.onMerge = function(context, cb) {
        context.object.userId = context.data.userId;

        //the verification code is overwritten each time the object is saved.  This makes it a singleton and prevents
        //multiple requests for a password reset, per user, floating around
        context.object.verificationCode = util.uniqueId();
        cb();
    };

    /**
     *
     * @static
     * @method validate
     * @param {Object} context
     * @param {Object} context.data The DTO that was provided for persistence
     * @param {PasswordResetService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    PasswordResetService.onValidate = function(context, cb) {
        context.service.validate(context, cb);
    };

    //Event Registries
    BaseObjectService.on(TYPE + '.' + BaseObjectService.FORMAT, PasswordResetService.onFormat);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.MERGE, PasswordResetService.onMerge);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.VALIDATE, PasswordResetService.onValidate);

    //exports
    return PasswordResetService;
};
