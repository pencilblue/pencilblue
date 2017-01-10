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
var ArrayUtils = require('../../../lib/utils/array_utils');
var async = require('async');
var BaseObjectService = require('../base_object_service');
var Configuration = require('../../config');
var DAO = require('../../dao/dao');
var EmailService = require('../../email');
var log = require('../../utils/logging');
var PasswordResetService = require('./password_reset_service');
var RegExpUtils = require('../../utils/reg_exp_utils');
var SecurityService = require('../../access_management');
var SiteQueryService = require('./site_query_service');
var SiteService = require('./site_service');
var ValidationService = require('../../validation/validation_service');

/**
 * Service for performing user specific operations.
 *
 * @module Services
 * @submodule Entities
 * @class UserService
 * @constructor
 */
class UserService extends BaseObjectService {
    constructor(context) {

        context.type = UserService.TYPE;
        super(context);
    }

    /**
     * @readonly
     * @type {String}
     */
    static get TYPE() {
        return 'user';
    }

    /**
     * @private
     * @static
     * @readonly
     * @property UNVERIFIED_TYPE
     * @type {String}
     */
    static get UNVERIFIED_TYPE() {
        return 'unverified_user';
    }

    /**
     * Gets the full name of a user
     * @method getFullName
     * @param {String} userId The object Id of the user
     * @param {Function} cb (Error, string)
     */
    getFullName(userId, cb) {
        if (!ValidationService.isId(userId, true)) {
            return cb(new Error('The userId parameter must be a valid ID value'));
        }

        var self = this;
        var dao = new DAO();
        dao.loadById(userId, UserService.TYPE, function (err, author) {
            if (_.isError(err)) {
                return cb(err, null);
            }

            cb(null, self.getFormattedName(author));
        });
    }

    /**
     * Takes the specified user object and formats the first and last name.
     * @static
     * @method getFormattedName
     * @param {Object} user The user object to extract a name for.
     * @return {String} The user's full name
     */
    getFormattedName(user) {
        var name = user.username;
        if (user.first_name) {
            name = user.first_name + ' ' + user.last_name;
        }
        return name;
    }

    /**
     * Gets the full names for the supplied authors
     *
     * @method getAuthors
     * @param {Array} objArry An array of user object
     * @param {Function} cb (Error, Array)
     */
    getAuthors(objArry, cb) {
        var self = this;

        //retrieve unique author list
        var authorIds = {};
        for (var i = 0; i < objArry.length; i++) {
            authorIds[objArry[i].author] = true;
        }

        //retrieve authors
        var opts = {
            select: {
                username: 1,
                first_name: 1,
                last_name: 1
            },
            where: DAO.getIdInWhere(Object.keys(authorIds))
        };
        var dao = new SiteQueryService({site: this.context.site});
        dao.q('user', opts, function (err, authors) {
            if (_.isError(err)) {
                return cb(err);
            }

            //convert results into searchable hash
            var authLookup = ArrayUtils.toObject(authors, function (author) {
                return author[DAO.getIdField()].toString();
            });

            //set the full name of the author
            for (var i = 0; i < objArry.length; i++) {
                objArry[i].author_name = self.getFormattedName(authLookup[objArry[i].author]);
            }

            //callback with objects (not necessary but we do it anyway)
            cb(null, objArry);
        });
    }

    /**
     * Retrieves the available access privileges to assign to a user
     *
     * @method getAdminOptions
     * @param {Object} session The current session object
     * @param {Localization} ls The localization object
     * @return {Array}
     */
    getAdminOptions(session, ls) {
        var adminOptions = [];

        //in multi-site deployments non-global sites are limited to user roles: READER, WRITER, EDITOR.
        //Admin roles (ADMINISTRATOR and MANAGING_EDITOR) are resevered for the global site.
        if (!Configuration.active.multisite.enabled || !SiteService.isGlobal(this.context.site)) {
            adminOptions.push(
                {name: ls.g('generic.READER'), value: SecurityService.ACCESS_USER},
                {name: ls.g('generic.WRITER'), value: SecurityService.ACCESS_WRITER},
                {name: ls.g('generic.EDITOR'), value: SecurityService.ACCESS_EDITOR}
            );
        }

        //we want these included for single site deployments too.  However, we
        //can guarantee that the site will be global in single site mode.
        if (SiteService.isGlobal(this.context.site)) {
            if (session.authentication.user.admin >= SecurityService.ACCESS_MANAGING_EDITOR) {
                adminOptions.push({
                    name: ls.g('generic.MANAGING_EDITOR'),
                    value: SecurityService.ACCESS_MANAGING_EDITOR
                });
            }
            if (session.authentication.user.admin >= SecurityService.ACCESS_ADMINISTRATOR) {
                adminOptions.push({
                    name: ls.g('generic.ADMINISTRATOR'),
                    value: SecurityService.ACCESS_ADMINISTRATOR
                });
            }
        }

        return adminOptions;
    }

    /**
     * Retrieves a select list (id/name) of available system editors
     * @deprecated since 0.4.0
     * @method getEditorSelectList
     * @param {String} currId The Id to be excluded from the list.
     * @param {Function} cb (Error, Array) A callback that takes two parameters.  The first is an
     * error, if exists, the second is an array of objects that represent the
     * editor select list.
     */
    getEditorSelectList(currId, cb) {
        log.warn('UserService: getEditorSelectList is deprecated. Use getWriterOrEditorSelectList instead');
        this.getWriterOrEditorSelectList(currId, cb);
    }

    /**
     * Retrieves a select list (id/name) of available system writers or editors
     * @method getWriterOrEditorSelectList
     * @param {String} currId The Id to be excluded from the list.
     * @param {Boolean} [getWriters=false] Whether to retrieve all writers or just editors.
     * @param {Function} cb A callback that takes two parameters.  The first is an
     * error, if exists, the second is an array of objects that represent the
     * editor select list.
     */
    getWriterOrEditorSelectList(currId, getWriters, cb) {
        if (_.isFunction(getWriters)) {
            cb = getWriters;
            getWriters = false;
        }

        var self = this;

        var opts = {
            select: {
                first_name: 1,
                last_name: 1
            },
            where: {
                admin: {
                    $gte: getWriters ? SecurityService.ACCESS_WRITER : SecurityService.ACCESS_EDITOR
                },
                $or: [
                    {site: self.context.site},
                    {site: SiteService.GLOBAL_SITE},
                    {site: {$exists: false}}
                ]
            }
        };
        var dao = new DAO();
        dao.q(UserService.TYPE, opts, function (err, data) {
            if (_.isError(err)) {
                return cb(err, null);
            }

            var editors = [];
            for (var i = 0; i < data.length; i++) {

                var editor = {
                    name: self.getFormattedName(data[i])
                };
                editor[DAO.getIdField()] = data[i][DAO.getIdField()];

                if (currId === data[i][DAO.getIdField()].toString()) {
                    editor.selected = 'selected';
                }
                editors.push(editor);
            }
            cb(null, editors);
        });
    }

    /**
     * @method getByUsernameOrEmail
     * @param {string} usernameOrEmail
     * @param {object} [options] See UserService#getSingle
     * @param {function} cb (Error, object) The user object
     */
    getByUsernameOrEmail(usernameOrEmail, options, cb) {
        if (_.isFunction(options)) {
            cb = options;
            options = {};
        }

        var usernameEmailSearchExp = RegExpUtils.getCaseInsensitiveExact(usernameOrEmail);
        options.where = {
            $or: [
                {
                    username: usernameEmailSearchExp
                },
                {
                    email: usernameEmailSearchExp
                }
            ]
        };
        this.getSingle(options, cb);
    }

    /**
     * Sends a verification email to an unverified user
     *
     * @method sendVerificationEmail
     * @param {Object}   user A user object
     * @param {Function} cb   Callback function
     */
    sendVerificationEmail(user, cb) {
        var self = this;
        cb = cb || function() {};

        var siteService = new SiteService();
        siteService.getByUid(self.context.site, function (err, siteInfo) {
            if (_.isError(err)) {
                log.error("UserService: Failed to load site with getByUid. ERROR[%s]", err.stack);
                return cb(err, null);
            }
            // We need to see if email settings have been saved with verification content
            var emailService = new EmailService({site: self.context.site});
            emailService.getSettings(function (err, emailSettings) {
                if (_.isError(err)) {
                    log.error("UserService: Failed to load email settings. ERROR[%s]", err.stack);
                    return cb(err, null);
                }
                var options = {
                    to: user.email,
                    replacements: {
                        'verification_url': SiteService.getHostWithProtocol(siteInfo.hostname) + '/actions/user/verify_email?email=' + user.email + '&code=' + user.verificationCode,
                        'first_name': user.first_name,
                        'last_name': user.last_name
                    }
                };
                if (emailSettings.layout) {
                    options.subject = emailSettings.verification_subject;
                    options.layout = emailSettings.verification_content;
                    emailService.sendFromLayout(options, cb);
                }
                else {
                    options.subject = siteInfo.displayName + ' Account Confirmation';
                    options.template = emailSettings.template;
                    emailService.sendFromTemplate(options, cb);
                }
            });
        });
    }

    /**
     * Sends a password reset email to a user
     * @deprecated
     * @method sendPasswordResetEmail
     * @param {object} user A user object
     * @param {object} passwordReset A password reset object containing the verification code
     * @param {function} cb (Error)
     */
    sendPasswordResetEmail(user, passwordReset, cb) {
        var self = this;
        cb = cb || function () {};

        log.warn('UserService: sendPasswordResetEmail is deprecated. Use PasswordResetService.sendPasswordResetEmail');
        var ctx = {
            emailService: new EmailService({site: self.context.site}),
            siteService: new SiteService(),
            site: self.context.site
        };
        var passwordResetService = new PasswordResetService(ctx);
        passwordResetService.sendPasswordResetEmail(user, passwordReset, cb);
    }

    /**
     * Checks to see if a proposed user name or email is already in the system
     *
     * @method isUserNameOrEmailTaken
     * @param {String}   username
     * @param {String}   email
     * @param {String}   id       User object Id to exclude from the search
     * @param {Function} cb       Callback function
     */
    isUserNameOrEmailTaken(username, email, id, cb) {
        this.getExistingUsernameEmailCounts(username, email, id, function (err, results) {

            var result = results === null;
            if (!result) {

                result = Object.keys(results).reduce(function (actual, key) {
                    return actual || (results[key] > 0);
                }, result);
            }
            cb(err, result);
        });
    }

    /**
     * Gets the total counts of a username and email in both the user and unverified_user collections
     * @method getExistingUsernameEmailCounts
     * @param {String} username
     * @param {String} email
     * @param {String} [id] User object Id to exclude from the search
     * @param {Function} cb (Error, object)
     */
    getExistingUsernameEmailCounts(username, email, id, cb) {
        var self = this;
        if (_.isFunction(id)) {
            cb = id;
            id = null;
        }

        var getWhere = function (where) {
            if (id) {
                where[DAO.getIdField()] = DAO.getNotIdField(id);
            }
            return where;
        };

        var dao = (SiteService.isGlobal(self.context.site)) ? new DAO() : new SiteQueryService({
            site: self.context.site,
            onlyThisSite: false
        });
        var tasks = {
            verified_username: function (callback) {
                var expStr = RegExpUtils.escapeRegExp(username) + '$';
                dao.count(UserService.TYPE, getWhere({username: new RegExp(expStr, 'i')}), callback);
            },
            verified_email: function (callback) {
                dao.count(UserService.TYPE, getWhere({email: email.toLowerCase()}), callback);
            },
            unverified_username: function (callback) {
                dao.count(UserService.UNVERIFIED_TYPE, getWhere({username: new RegExp(username + '$', 'i')}), callback);
            },
            unverified_email: function (callback) {
                dao.count(UserService.UNVERIFIED_TYPE, getWhere({email: email.toLowerCase()}), callback);
            }
        };
        async.series(tasks, cb);
    }

    /**
     * Indicates if there exists a user with the specified email value. The
     * field is expected to be a string value.  The values will be compare with
     * case ignored.
     * @method isUsernameInUse
     * @param {String} email
     * @param {Object} [options]
     * @param {String} [options.exclusionId]
     * @param {Function} cb
     */
    isEmailInUse(email, options, cb) {
        this._isFieldInUse(email, 'email', options, cb);
    }

    /**
     * Indicates if there exists a user with the specified username value. The
     * field is expected to be a string value.  The values will be compare with
     * case ignored.
     * @method isUsernameInUse
     * @param {String} username
     * @param {Object} [options]
     * @param {String} [options.exclusionId]
     * @param {Function} cb
     */
    isUsernameInUse(username, options, cb) {
        this._isFieldInUse(username, 'username', options, cb);
    }

    /**
     * Indicates if there exists a user with the specified property value. The
     * field is expected to be a string value.  The values will be compare with
     * case ignored.
     * @private
     * @method _isFieldInUse
     * @param {String} value
     * @param {String} field
     * @param {Object} [options]
     * @param {String} [options.exclusionId]
     * @param {Function} cb
     */
    _isFieldInUse(value, field, options, cb) {
        if (_.isFunction(options)) {
            cb = options;
            options = {};
        }

        var self = this;
        var expressionStr = RegExpUtils.escapeRegExp(value) + '$';
        var where = {};
        where[field] = new RegExp(expressionStr, 'i');

        //set exclusion.  This would be if we are editing a user
        if (ValidationService.isId(options.exclusionId, true)) {
            where[DAO.getIdField()] = DAO.getNotIdField(options.exclusionId);
        }

        var opts = {
            where: where
        };
        var tasks = {

            verified: function (callback) {
                self.count(opts, callback);
            },

            unverified: function (callback) {
                var dao = new DAO();
                dao.count(UserService.UNVERIFIED_TYPE, where, callback);
            }
        };
        async.series(tasks, function (err, results) {
            cb(err, results.verified > 0 || results.unverified > 0);
        });
    }

    /**
     * Retrieves users by their access level (role)
     * @method findByAccessLevel
     * @param {Integer} level The admin level of the users to find
     * @param {Object} [options] The search options
     * @param {Object} [options.select={}] The fields to return
     * @param {Array} [options.orderBy] The order to return the results in
     * @param {Integer} [options.limit] The maximum number of results to return
     * @param {offset} [options.offset=0] The number of results to skip before
     * returning results.
     * @param {Function} cb (Error, Array) A callback that takes two parameters: an error, if
     * occurred, and the second is an array of User objects.
     */
    findByAccessLevel(level, options, cb) {
        if (_.isFunction(options)) {
            cb = options;
            options = {};
        }
        else if (!_.isObject(options)) {
            throw new Error('The options parameter must be an object');
        }

        var opts = {
            select: options.select,
            where: {
                admin: level
            },
            order: options.orderBy,
            limit: options.limit,
            offset: options.offset
        };
        var dao = new DAO();
        dao.q(UserService.TYPE, opts, cb);
    }

    /**
     * Verifies if a user has the provided access level or higher
     *
     * @method hasAccessLevel
     * @param {String}   uid         The user's object Id
     * @param {Number}   accessLevel The access level to test against
     * @param {Function} cb          Callback function
     */
    hasAccessLevel(uid, accessLevel, cb) {
        var where = DAO.getIdWhere(uid);
        where.admin = {$gte: accessLevel};
        var dao = new DAO();
        dao.count(UserService.TYPE, where, function (err, count) {
            cb(err, count === 1);
        });
    }

    /**
     * @method determineUserSiteScope
     * @param {Integer} accessLevel
     * @param {string} siteId
     * @returns {*}
     */
    determineUserSiteScope(accessLevel, siteId) {
        if (accessLevel === SecurityService.ACCESS_MANAGING_EDITOR ||
            accessLevel === SecurityService.ACCESS_ADMINISTRATOR) {
            return SiteService.GLOBAL_SITE;
        }
        else if (siteId === SiteService.GLOBAL_SITE) {
            return null;
        }
        return siteId;
    }

    /**
     *
     * @method validate
     * @param {Object} context
     * @param {Object} context.data The DTO that was provided for persistence
     * @param {UserService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb (Error) A callback that takes a single parameter: an error if occurred
     */
    validate(context, cb) {
        var self = this;
        var obj = context.data;
        var errors = context.validationErrors;

        var tasks = [

            //first name
            function (callback) {
                if (!ValidationService.isNonEmptyStr(obj.first_name, false)) {
                    errors.push(BaseObjectService.validationFailure('first_name', 'First name is required'));
                }
                callback();
            },

            //last name
            function (callback) {
                if (!ValidationService.isNonEmptyStr(obj.last_name, false)) {
                    errors.push(BaseObjectService.validationFailure('last_name', 'Last name is required'));
                }
                callback();
            },

            //username
            function (callback) {
                if (!ValidationService.isNonEmptyStr(obj.username, true)) {
                    errors.push(BaseObjectService.validationFailure('username', 'Username is required'));
                    return callback();
                }

                //check to see if it is in use
                var usernameOpts = {
                    exclusionId: obj[DAO.getIdField()]
                };
                self.isUsernameInUse(obj.username, usernameOpts, function (err, isInUse) {
                    if (isInUse) {
                        errors.push(BaseObjectService.validationFailure('username', 'Username is already in use'));
                    }
                    callback(err);
                });
            },

            //email
            function (callback) {
                if (!ValidationService.isEmail(obj.email, true)) {
                    errors.push(BaseObjectService.validationFailure('email', 'Email is required'));
                    return callback();
                }

                //check to see if it is in use
                var usernameOpts = {
                    exclusionId: obj[DAO.getIdField()]
                };
                self.isEmailInUse(obj.email, usernameOpts, function (err, isInUse) {
                    if (isInUse) {
                        errors.push(BaseObjectService.validationFailure('email', 'Email address is already in use'));
                    }
                    callback(err);
                });
            },

            //password
            function (callback) {
                if (!ValidationService.isNonEmptyStr(obj.password, true)) {
                    errors.push(BaseObjectService.validationFailure('password', 'Password is required'));
                }
                callback();
            },

            //admin
            function (callback) {
                if (!ValidationService.isInt(obj.admin, true, true)) {
                    errors.push(BaseObjectService.validationFailure('admin', 'Role is required'));
                    return callback();
                }
                else if (obj.admin > SecurityService.ACCESS_ADMINISTRATOR || obj.admin < SecurityService.ACCESS_USER) {
                    errors.push(BaseObjectService.validationFailure('admin', 'An invalid role was provided'));
                }
                callback();
            },

            //locale
            function (callback) {
                if (!ValidationService.isNonEmptyStr(obj.locale, true)) {
                    errors.push(BaseObjectService.validationFailure('locale', 'Preferred locale is required'));
                }
                callback();
            },

            //photo
            function (callback) {
                if (!ValidationService.isNonEmptyStr(obj.photo, false)) {
                    errors.push(BaseObjectService.validationFailure('photo', 'An invalid photo was provided'));
                }
                callback();
            },

            //position
            function (callback) {
                if (!ValidationService.isNonEmptyStr(obj.position, false)) {
                    errors.push(BaseObjectService.validationFailure('position', 'An invalid position was provided'));
                }
                callback();
            }
        ];
        async.series(tasks, cb);
    }

    /**
     *
     * @static
     * @method
     * @param {Object} context
     * @param {UserService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {object} context.data
     * @param {Function} cb (Error) A callback that takes a single parameter: an error if occurred
     */
    format(context, cb) {
        var dto = context.data;
        dto.first_name = BaseObjectService.sanitize(dto.first_name);
        dto.last_name = BaseObjectService.sanitize(dto.last_name);
        dto.username = BaseObjectService.sanitize(dto.username);
        dto.email = BaseObjectService.sanitize(dto.email);
        if (dto.email) {
            dto.email = dto.email.toLowerCase();
        }
        dto.admin = parseInt(dto.admin);
        dto.locale = BaseObjectService.sanitize(dto.locale);
        dto.photo = BaseObjectService.sanitize(dto.photo);
        dto.position = BaseObjectService.sanitize(dto.position);
        cb(null);
    }

    /**
     *
     * @static
     * @method
     * @param {Object} context
     * @param {UserService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {object} context.data The DTO
     * @param {object} context.object The entity object to be persisted
     * @param {Function} cb (Error) A callback that takes a single parameter: an error if occurred
     */
    merge(context, cb) {
        var dto = context.data;
        var obj = context.object;

        obj.first_name = dto.first_name;
        obj.last_name = dto.last_name;
        obj.username = dto.username;
        obj.email = dto.email;
        obj.admin = dto.admin;
        obj.locale = dto.locale;
        obj.photo = dto.photo;
        obj.position = dto.position;
        if (context.isCreate && dto.password) {
            obj.password = SecurityService.encrypt(dto.password);
        }
        cb(null);
    }

    /**
     *
     * @static
     * @method validate
     * @param {Object} context
     * @param {Object} context.data The DTO that was provided for persistence
     * @param {UserService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    static validate(context, cb) {
        context.service.validate(context, cb);
    }

    /**
     * Strips the password from one or more user objects when passed a valid
     * base object service event context
     * @static
     * @method removePassword
     * @param {Object} context
     * @param {Object} context.data The DTO that was provided for persistence
     * @param {UserService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    static removePassword(context, cb) {
        var data = context.data;
        if (Array.isArray(data)) {
            data.forEach(function (user) {
                delete user.password;
            });
        }
        else if (_.isObject(data)) {
            delete data.password;
        }
        cb();
    }
}

//Event Registries
BaseObjectService.on(UserService.TYPE + '.' + BaseObjectService.AFTER_SAVE, UserService.removePassword);
BaseObjectService.on(UserService.TYPE + '.' + BaseObjectService.GET, UserService.removePassword);
BaseObjectService.on(UserService.TYPE + '.' + BaseObjectService.GET_ALL, UserService.removePassword);
BaseObjectService.on(UserService.TYPE + '.' + BaseObjectService.FORMAT, UserService.format);
BaseObjectService.on(UserService.TYPE + '.' + BaseObjectService.MERGE, UserService.merge);
BaseObjectService.on(UserService.TYPE + '.' + BaseObjectService.VALIDATE, UserService.validate);

module.exports = UserService;
