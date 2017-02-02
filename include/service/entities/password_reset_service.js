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
var _ = require('lodash');
var async = require('async');
var BaseObjectService = require('../base_object_service');
var DAO = require('../../dao/dao');
var ErrorUtils = require('../../error/error_utils');
var SiteService = require('./site_service');
var TaskUtils = require ('../../../lib/utils/taskUtils');
var UrlUtils = require ('../../../lib/utils/urlUtils');
var util = require('util');
var uuid = require('uuid');
var ValidationService = require('../../validation/validation_service');

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
class PasswordResetService extends BaseObjectService {
    constructor(context) {
        if (!_.isObject(context)) {
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

        context.type = PasswordResetService.TYPE;
        super(context);
    }

    /**
     * @readonly
     * @type {String}
     */
    static get TYPE () {
        return 'password_reset';
    }

    /**
     * @method addIfNotExists
     * @param {string} usernameOrEmail
     * @param {function} cb (Error, {created: boolean, data: {}})
     */
    addIfNotExists(usernameOrEmail, cb) {
        var self = this;

        //retrieve the user
        this.userService.getByUsernameOrEmail(usernameOrEmail, {}, function (err, userObj) {
            if (_.isError(err)) {
                return cb(err);
            }
            if (_.isNil(userObj)) {
                return cb(ErrorUtils.notFound());
            }

            //attempt to retrieve any existing reset
            self.getSingle({where: {userId: userObj[DAO.getIdField()].toString()}}, function (err, passwordResetObj) {
                if (_.isError(err)) {
                    return cb(err);
                }

                //need to know if we should create the DTO or not
                var created = !passwordResetObj;
                if (created) {
                    passwordResetObj = {userId: userObj[DAO.getIdField()].toString()};
                }

                //now persist it back
                self.save(passwordResetObj, function (err, persistedPasswordReset) {
                    if (_.isError(err)) {
                        return cb(err);
                    }

                    //now attempt to send the notification
                    self.sendPasswordResetEmail(userObj, persistedPasswordReset, function (err) {
                        cb(err, {
                            created: created,
                            data: persistedPasswordReset
                        });
                    });
                });
            });
        });
    }

    /**
     * Sends a password reset email to a user
     * @method sendPasswordResetEmail
     * @param {object} user A user object
     * @param {object} passwordReset A password reset object containing the verification code
     * @param {function} cb (Error)
     */
    sendPasswordResetEmail(user, passwordReset, cb) {
        var self = this;

        var tasks = [
            TaskUtils.wrapTask(this.siteService, this.siteService.getByUid, [this.context.site]),
            function (siteInfo, callback) {
                var root = SiteService.getHostWithProtocol(siteInfo.hostname);
                var verificationUrl = UrlUtils.urlJoin(root, '/actions/user/reset_password') +
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
    }

    /**
     * @method validate
     * @param context
     * @param {object} context.data
     * @param {Array} context.validationErrors
     * @param {function} cb
     * @returns {*}
     */
    validate(context, cb) {
        var tasks = [
            TaskUtils.wrapTask(this, this.validateUserId, [context]),
            TaskUtils.wrapTask(this, this.validateVerificationCode, [context])
        ];
        async.parallel(tasks, cb);
    }

    validateUserId(context, cb) {
        var obj = context.data;
        var errors = context.validationErrors;

        if (!ValidationService.isIdStr(obj.userId, true)) {
            errors.push(BaseObjectService.validationFailure('userId', 'The userId must be a valid string'));
            return cb();
        }

        var options = {
            where: DAO.getIdWhere(obj.userId)
        };
        this.userService.count(options, function (err, count) {
            if (count !== 1) {
                errors.push(BaseObjectService.validationFailure('userId', 'The userId must reference an existing user'));
            }
            cb(err);
        });
    }

    validateVerificationCode(context, cb) {
        var obj = context.data;
        var errors = context.validationErrors;

        if (!ValidationService.isNonEmptyStr(obj.verificationCode, true)) {
            errors.push(BaseObjectService.validationFailure('verificationCode', 'The verificationCode must be a non-empty string'));
            return cb();
        }

        var where = {
            verificationCode: obj.verificationCode
        };
        this.dao.unique(PasswordResetService.TYPE, where, obj[DAO.getIdField()], function (err, isUnique) {
            if (!isUnique) {
                errors.push(BaseObjectService.validationFailure('verificationCode', 'The verificationCode must be unique'));
            }
            cb(err);
        });
    }

    /**
     *
     * @static
     * @method
     * @param {Object} context
     * @param {PasswordResetService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    static onFormat(context, cb) {
        var dto = context.data;
        dto.userId = BaseObjectService.sanitize(dto.userId);
        cb();
    }

    /**
     *
     * @static
     * @method
     * @param {Object} context
     * @param {PasswordResetService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    static onMerge(context, cb) {
        context.object.userId = context.data.userId;

        //the verification code is overwritten each time the object is saved.  This makes it a singleton and prevents
        //multiple requests for a password reset, per user, floating around
        context.object.verificationCode = uuid.v4();
        cb();
    }

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
    static onValidate(context, cb) {
        context.service.validate(context, cb);
    }
}

//Event Registries
BaseObjectService.on(PasswordResetService.TYPE + '.' + BaseObjectService.FORMAT, PasswordResetService.onFormat);
BaseObjectService.on(PasswordResetService.TYPE + '.' + BaseObjectService.MERGE, PasswordResetService.onMerge);
BaseObjectService.on(PasswordResetService.TYPE + '.' + BaseObjectService.VALIDATE, PasswordResetService.onValidate);

//exports
module.exports = PasswordResetService;
