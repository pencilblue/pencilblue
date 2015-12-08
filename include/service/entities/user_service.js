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

//dependencies
var async = require('async');
var util  = require('../../util.js');

module.exports = function(pb) {
    
    //pb dependencies
    var DAO               = pb.DAO;
    var SecurityService   = pb.SecurityService;
    var ValidationService = pb.ValidationService;
    var BaseObjectService = pb.BaseObjectService;

    /**
     * Service for performing user specific operations.
     *
     * @module Services
     * @submodule Entities
     * @class UserService
     * @constructor
     */
    function UserService(context){
        if (!util.isObject(context)) {
            context = {};
        }
        
        context.type = TYPE;
        UserService.super_.call(this, context);
    }
    util.inherits(UserService, BaseObjectService);
    
    /**
     * @private
     * @static
     * @readonly
     * @property TYPE
     * @type {String}
     */
    var TYPE = 'user';
    
    /**
     * @private
     * @static
     * @readonly
     * @property UNVERIFIED_TYPE
     * @type {String}
     */
    var UNVERIFIED_TYPE = 'unverified_user';

    /**
     * Gets the full name of a user
     *
     * @method getFullName
     * @param {String}   userId The object Id of the user
     * @param {Function} cb     Callback function
     */
    UserService.prototype.getFullName = function(userId, cb) {
        if (!pb.validation.isId(userId, true)) {
            return cb(new Error('The userId parameter must be a valid ID value'));
        }

        var self = this;
        var dao  = new pb.DAO();
        dao.loadById(userId, TYPE, function(err, author){
            if (util.isError(err)) {
                return callback(err, null);
            }

            cb(null, self.getFormattedName(author));
        });
    };

    /**
     * Takes the specified user object and formats the first and last name.
     * @static
     * @method getFormattedName
     * @param {Object} user The user object to extract a name for.
     * @return {String} The user's full name
     */
    UserService.prototype.getFormattedName = function(user) {
        var name = user.username;
        if (user.first_name) {
            name = user.first_name + ' ' + user.last_name;
        }
        return name;
    };

    /**
     * Gets the full names for the supplied authors
     *
     * @method getAuthors
     * @param {Array}   objArry An array of user object
     * @param {Function} cb     Callback function
     */
    UserService.prototype.getAuthors = function(objArry, cb){
        var self  = this;

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
            where: pb.DAO.getIdInWhere(Object.keys(authorIds))
        };
        var dao = new pb.SiteQueryService({site: this.context.site});
        dao.q('user', opts, function(err, authors) {
            if (util.isError(err)) {
                return cb(err);
            }

            //convert results into searchable hash
            var authLookup = util.arrayToObj(authors, function(authors, i) { return authors[i][pb.DAO.getIdField()].toString(); });

            //set the full name of the author
            for (var i = 0; i < objArry.length; i++) {
                objArry[i].author_name = self.getFormattedName(authLookup[objArry[i].author]);
            }

            //callback with objects (not necessary but we do it anyway)
            cb(null, objArry);
        });
    };

    /**
     * Retrieves the available access privileges to assign to a user
     *
     * @method getAdminOptions
     * @param {Object} session The current session object
     * @param {Object} ls      The localization object
     * @param {String} siteUid
     */
    UserService.prototype.getAdminOptions = function (session, ls) {
        var adminOptions = [];

        if (!pb.SiteService.isGlobal(this.context.site)) {
            adminOptions = [
                {name: ls.get('READER'), value: pb.SecurityService.ACCESS_USER},
                {name: ls.get('WRITER'), value: pb.SecurityService.ACCESS_WRITER},
                {name: ls.get('EDITOR'), value: pb.SecurityService.ACCESS_EDITOR}
            ];
        }
        else {
            if (session.authentication.user.admin >= pb.SecurityService.ACCESS_MANAGING_EDITOR) {
                adminOptions.push({name: ls.get('MANAGING_EDITOR'), value: pb.SecurityService.ACCESS_MANAGING_EDITOR});
            }
            if (session.authentication.user.admin >= pb.SecurityService.ACCESS_ADMINISTRATOR) {
                adminOptions.push({name: ls.get('ADMINISTRATOR'), value: pb.SecurityService.ACCESS_ADMINISTRATOR});
            }
        }

        return adminOptions;
    };
    
    /**
     * Retrieves a select list (id/name) of available system editors
     * @deprecated since 0.4.0
     * @method getEditorSelectList
     * @param {String} currId The Id to be excluded from the list.
     * @param {Function} cb A callback that takes two parameters.  The first is an
     * error, if exists, the second is an array of objects that represent the
     * editor select list.
     */
    UserService.prototype.getEditorSelectList = function(currId, cb) {
        pb.log.warn('UserService: getEditorSelectList is deprecated. Use getWriterOrEditorSelectList instead');
        this.getWriterOrEditorSelectList(currId, cb);
    };

    /**
     * Retrieves a select list (id/name) of available system writers or editors
     * @method getWriterOrEditorSelectList
     * @param {String} currId The Id to be excluded from the list.
     * @param {Boolean} [getWriters=false] Whether to retrieve all writers or just editors.
     * @param {Function} cb A callback that takes two parameters.  The first is an
     * error, if exists, the second is an array of objects that represent the
     * editor select list.
     */
    UserService.prototype.getWriterOrEditorSelectList = function(currId, getWriters, cb) {
        if (util.isFunction(getWriters)) {
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
                    $gte: getWriters ? pb.SecurityService.ACCESS_WRITER : pb.SecurityService.ACCESS_EDITOR
                },
                $or: [
                    { site: self.context.site },
                    { site: pb.SiteService.GLOBAL_SITE },
                    { site: { $exists: false } }
                ]
            }
        };
        var dao = new pb.DAO();
        dao.q(TYPE, opts, function(err, data){
            if (util.isError(err)) {
                return cb(err, null);
            }

            var editors = [];
            for(var i = 0; i < data.length; i++) {

                var editor = {
                    name: self.getFormattedName(data[i])
                };
                editor[pb.DAO.getIdField()] = data[i][pb.DAO.getIdField()];

                if(currId == data[i][pb.DAO.getIdField()].toString()) {
                    editor.selected = 'selected';
                }
                editors.push(editor);
            }
            cb(null, editors);
        });
    };

    /**
     * Sends a verification email to an unverified user
     *
     * @method sendVerificationEmail
     * @param {Object}   user A user object
     * @param {Function} cb   Callback function
     */
    UserService.prototype.sendVerificationEmail = function(user, cb) {
        var self = this;
        cb = cb || util.cb;

        var siteService = new pb.SiteService();
        siteService.getByUid(self.context.site, function(err, siteInfo) {
            if (pb.util.isError(err)) {
                pb.log.error("UserService: Failed to load site with getByUid. ERROR[%s]", err.stack);
                return cb(err, null);
            }
            // We need to see if email settings have been saved with verification content
            var emailService = new pb.EmailService({site: self.context.site});
            emailService.getSettings(function (err, emailSettings) {
                if (pb.util.isError(err)) {
                    pb.log.error("UserService: Failed to load email settings. ERROR[%s]", err.stack);
                    return cb(err, null);
                }
                var options = {
                    to: user.email,
                    replacements: {
                        'verification_url': pb.SiteService.getHostWithProtocol(siteInfo.hostname) + '/actions/user/verify_email?email=' + user.email + '&code=' + user.verification_code,
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
    };

    /**
     * Sends a password reset email to a user
     *
     * @method sendPasswordResetEmail
     * @param {Object}   user          A user object
     * @param {Object}   passwordReset A password reset object containing the verification code
     * @param {Function} cb            Callback function
     */
    UserService.prototype.sendPasswordResetEmail = function(user, passwordReset, cb) {
        var self = this;
        cb = cb || util.cb;

        var siteService = new pb.SiteService();
        siteService.getByUid(self.context.site, function(err, siteInfo) {
            // Handle errors
            if (pb.util.isError(err)) {
                pb.log.error("UserService: Failed to load site with getByUid. ERROR[%s]", err.stack);
                return cb(err, null);
            }
            var root = pb.SiteService.getHostWithProtocol(siteInfo.hostname);
            var verficationUrl = pb.UrlService.urlJoin(root, '/actions/user/reset_password') + 
                util.format('?email=%s&code=%s', encodeURIComponent(user.email), encodeURIComponent(passwordReset.verification_code));
            var options = {
                to: user.email,
                subject: siteInfo.displayName + ' Password Reset',
                template: 'admin/elements/password_reset_email',
                replacements: {
                    'verification_url': verficationUrl,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                }
            };
            var emailService = new pb.EmailService({site: self.context.site});
            emailService.sendFromTemplate(options, cb);
        });
    };

    /**
     * Checks to see if a proposed user name or email is already in the system
     *
     * @method isUserNameOrEmailTaken
     * @param {String}   username
     * @param {String}   email
     * @param {String}   id       User object Id to exclude from the search
     * @param {Function} cb       Callback function
     */
    UserService.prototype.isUserNameOrEmailTaken = function(username, email, id, cb) {
        this.getExistingUsernameEmailCounts(username, email, id, function(err, results) {

            var result = results === null;
            if (!result) {

                for(var key in results) {
                    result |= results[key] > 0;
                }
            }
            cb(err, result);
        });
    };

    /**
     * Gets the total counts of a username and email in both the user and unverified_user collections
     * @method getExistingUsernameEmailCounts
     * @param {String}   username
     * @param {String}   email
     * @param {String}   id       User object Id to exclude from the search
     * @param {Function} cb       Callback function
     */
    UserService.prototype.getExistingUsernameEmailCounts = function(username, email, id, cb) {
        var self = this;
        if (util.isFunction(id)) {
            cb = id;
            id = null;
        }

        var getWhere = function(where) {
            if (id) {
                where[pb.DAO.getIdField()] = pb.DAO.getNotIdField(id);
            }
            return where;
        };

        var dao = (pb.SiteService.isGlobal(self.context.site)) ? new pb.DAO() : new pb.SiteQueryService({site: self.context.site, onlyThisSite: false});
        var tasks = {
            verified_username: function(callback) {
                var expStr = util.escapeRegExp(username) + '$';
                dao.count(TYPE, getWhere({username: new RegExp(expStr, 'i')}), callback);
            },
            verified_email: function(callback) {
                dao.count(TYPE, getWhere({email: email.toLowerCase()}), callback);
            },
            unverified_username: function(callback) {
                dao.count(UNVERIFIED_TYPE, getWhere({username: new RegExp(username + '$', 'i')}), callback);
            },
            unverified_email: function(callback) {
                dao.count(UNVERIFIED_TYPE, getWhere({email: email.toLowerCase()}), callback);
            },
        };
        async.series(tasks, cb);
    };
    
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
    UserService.prototype.isEmailInUse = function(email, options, cb) {
        this._isFieldInUse(email, 'email', options, cb);
    };
    
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
    UserService.prototype.isUsernameInUse = function(username, options, cb) {
        this._isFieldInUse(username, 'username', options, cb);
    };
    
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
    UserService.prototype._isFieldInUse = function(value, field, options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }
        
        var self = this;
        var expressionStr = util.escapeRegExp(value) + '$';
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
            
            verified: function(callback) {
                self.count(opts, callback);
            },
            
            unverified: function(callback) {
                var dao = new pb.DAO();
                dao.count(UNVERIFIED_TYPE, where, callback);
            }
        };
        async.series(tasks, function(err, results) {
            cb(err, results.verified > 0 || results.unverified > 0);
        });
    };

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
     * @param {Function} cb A callback that takes two parameters: an error, if
     * occurred, and the second is an array of User objects.
     */
    UserService.prototype.findByAccessLevel = function(level, options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        else if (!util.isObject(options)) {
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
        var dao = new pb.DAO();
        dao.q(TYPE, opts, cb);
    };

    /**
     * Verifies if a user has the provided access level or higher
     *
     * @method hasAccessLevel
     * @param {String}   uid         The user's object Id
     * @param {Number}   accessLevel The access level to test against
     * @param {Function} cb          Callback function
     */
    UserService.prototype.hasAccessLevel = function(uid, accessLevel, cb) {
        var where = pb.DAO.getIdWhere(uid);
        where.admin = {$gte: accessLevel};
        var dao = new pb.DAO();
        dao.count(TYPE, where, function(err, count) {
            cb(err, count === 1);
        });
    };

    UserService.prototype.determineUserSiteScope = function(accessLevel, siteid) {
        if (accessLevel === pb.SecurityService.ACCESS_MANAGING_EDITOR || 
            accessLevel === pb.SecurityService.ACCESS_ADMINISTRATOR) {
            return pb.SiteService.GLOBAL_SITE;
        }
        else if (siteid === pb.SiteService.GLOBAL_SITE) {
            return null;
        }
        return siteid;
    };
    
    /**
     * 
     * @method validate
     * @param {Object} context
     * @param {Object} context.data The DTO that was provided for persistence
     * @param {UserService} context.service An instance of the service that triggered 
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    UserService.prototype.validate = function(context, cb) {
        var self = this;
        var obj = context.data;
        var errors = context.validationErrors;
        
        var tasks = [
            
            //first name
            function(callback) {
                if (!ValidationService.isNonEmptyStr(obj.first_name, false)) {
                    errors.push(BaseObjectService.validationFailure('first_name', 'First name is required'));
                }
                callback();
            },
            
            //last name
            function(callback) {
                if (!ValidationService.isNonEmptyStr(obj.last_name, false)) {
                    errors.push(BaseObjectService.validationFailure('last_name', 'Last name is required'));
                }
                callback();
            },
            
            //username
            function(callback) {
                if (!ValidationService.isNonEmptyStr(obj.username, true)) {
                    errors.push(BaseObjectService.validationFailure('username', 'Username is required'));
                    return callback();
                }
                
                //check to see if it is in use
                var usernameOpts = {
                    exclusionId: obj[DAO.getIdField()]
                };
                self.isUsernameInUse(obj.username, usernameOpts, function(err, isInUse) {
                    if (isInUse) {
                        errors.push(BaseObjectService.validationFailure('username', 'Username is already in use'));
                    }
                    callback(err);
                });
            },
            
            //email
            function(callback) {
                if (!ValidationService.isEmail(obj.email, true)) {
                    errors.push(BaseObjectService.validationFailure('email', 'Email is required'));
                    return callback();
                }
                
                //check to see if it is in use
                var usernameOpts = {
                    exclusionId: obj[DAO.getIdField()]
                };
                self.isEmailInUse(obj.email, usernameOpts, function(err, isInUse) {
                    if (isInUse) {
                        errors.push(BaseObjectService.validationFailure('email', 'Email address is already in use'));
                    }
                    callback(err);
                });
            },
            
            //password
            function(callback) {
                if (!ValidationService.isNonEmptyStr(obj.password, true)) {
                    errors.push(BaseObjectService.validationFailure('password', 'Password is required'));
                }
                callback();
            },
            
            //admin
            function(callback) {
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
            function(callback) {
                if (!ValidationService.isNonEmptyStr(obj.locale, true)) {
                    errors.push(BaseObjectService.validationFailure('locale', 'Preferred locale is required'));
                }
                callback();
            },
            
            //photo
            function(callback) {
                if (!ValidationService.isNonEmptyStr(obj.photo, false)) {
                    errors.push(BaseObjectService.validationFailure('photo', 'An invalid photo was provided'));
                }
                callback();
            },
            
            //position
            function(callback) {
                if (!ValidationService.isNonEmptyStr(obj.position, false)) {
                    errors.push(BaseObjectService.validationFailure('position', 'An invalid position was provided'));
                }
                callback();
            }
        ];
        async.series(tasks, cb);
    };
    
    /**
     * 
     * @static
     * @method 
     * @param {Object} context
     * @param {UserService} service An instance of the service that triggered 
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    UserService.format = function(context, cb) {
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
    };
    
    /**
     * 
     * @static
     * @method 
     * @param {Object} context
     * @param {UserService} service An instance of the service that triggered 
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    UserService.merge = function(context, cb) {
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
            obj.password = pb.security.encrypt(dto.password);
        }
        cb(null);
    };
    
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
    UserService.validate = function(context, cb) {
        context.service.validate(context, cb);
    };
    
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
    UserService.removePassword = function(context, cb) {
        var data = context.data;
        if (util.isArray(data)) {
            data.forEach(function(user) {
                delete user.password;
            });
        }
        else if (util.isObject(data)) {
            delete data.password;
        }
        cb();
    };
    
    //Event Registries
    BaseObjectService.on(TYPE + '.' + BaseObjectService.AFTER_SAVE, UserService.removePassword);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.GET, UserService.removePassword);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.GET_ALL, UserService.removePassword);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.FORMAT, UserService.format);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.MERGE, UserService.merge);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.VALIDATE, UserService.validate);
    
    return UserService;
};
