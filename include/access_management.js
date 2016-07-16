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
var crypto = require('crypto');
var util   = require('./util.js');

module.exports = function(pb) {

    /**
     * Service for managing user access
     *
     * @module Services
     * @submodule Security
     * @class SecurityService
     * @constructor
     */
    function SecurityService(){}

    /**
     *
     * @static
     * @readonly
     * @property ACCESS_USER
     * @type {Integer}
     */
    SecurityService.ACCESS_USER = 0;

    /**
     *
     * @static
     * @readonly
     * @property ACCESS_WRITER
     * @type {Integer}
     */
    SecurityService.ACCESS_WRITER = 1;

    /**
     *
     * @static
     * @readonly
     * @property ACCESS_EDITOR
     * @type {Integer}
     */
    SecurityService.ACCESS_EDITOR = 2;

    /**
     *
     * @static
     * @readonly
     * @property ACCESS_MANAGING_EDITOR
     * @type {Integer}
     */
    SecurityService.ACCESS_MANAGING_EDITOR = 3;

    /**
     *
     * @static
     * @readonly
     * @property ACCESS_ADMINISTRATOR
     * @type {Integer}
     */
    SecurityService.ACCESS_ADMINISTRATOR = 4;

    /**
     * Provides an array of all of the system roles.  It provides their numeric value as well as the unique string key
     * @static
     * @readonly
     * @property SYSTEM_ROLES
     * @type {Array}
     */
    SecurityService.SYSTEM_ROLES = Object.freeze([
        {
            key: 'ACCESS_USER',
            localizationKey: 'generic.ACCESS_USER',
            value: 0
        },
        {
            key: 'ACCESS_WRITER',
            localizationKey: 'generic.ACCESS_WRITER',
            value: 1
        },
        {
            key: 'ACCESS_EDITOR',
            localizationKey: 'generic.ACCESS_EDITOR',
            value: 2
        },
        {
            key: 'ACCESS_MANAGING_EDITOR',
            localizationKey: 'generic.ACCESS_MANAGING_EDITOR',
            value: 3
        },
        {
            key: 'ACCESS_ADMINISTRATOR',
            localizationKey: 'generic.ACCESS_ADMINISTRATOR',
            value: 4
        }
    ]);

    /**
     *
     * @private
     * @static
     * @readonly
     * @property PASSWORD_CHARS
     * @type {Array}
     */
    var PASSWORD_CHARS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '!', '@', '#', '$', '%', '^', '&', '*', '?'];

    /**
     *
     * @private
     * @static
     * @readonly
     * @property ROLE_VAL_TO_NAME
     * @type {Array}
     */
    var ROLE_VAL_TO_NAME = SecurityService.SYSTEM_ROLES.reduce(function(prev, curr) {
        prev[curr.value] = curr.key;
        return prev;
    }, {});

    /**
     *
     * @static
     * @readonly
     * @property ACCESS_
     * @type {Integer}
     */
    SecurityService.AUTHENTICATED = 'authenticated';

    /**
     *
     * @static
     * @readonly
     * @property ACCESS_
     * @type {Integer}
     */
    SecurityService.ADMIN_LEVEL = 'admin_level';

    /**
     * Retrieves the localized names of access levels as an array
     *
     * @method getRoleNames
     * @param {Localization} ls The localization service
     * @return {Array}
     */
    SecurityService.getRoleNames = function(ls) {
        var map = SecurityService.getRoleToDisplayNameMap(ls);
        return util.hashToArray(map);
    };

    /**
     * Provides a hash of the default roles to their translated display name
     * @static
     * @method getRoleToDisplayNameMap
     * @param {Localization} ls
     * @return {Object}
     */
    SecurityService.getRoleToDisplayNameMap = function(ls) {
        if (util.isNullOrUndefined(ls)) {
            throw new Error('The localization parameter cannot be null');
        }

        return SecurityService.SYSTEM_ROLES.reduce(function(prev, curr) {
            prev[curr.key] = ls.g(curr.localizationKey);
            return prev;
        }, {});
    };

    /**
     * Returns the constant name of an access level number
     *
     * @method getRoleName
     * @param {Number} accessLevel
     */
    SecurityService.getRoleName = function(accessLevel) {
        var val = ROLE_VAL_TO_NAME[accessLevel];
        if (!val) {
            throw new Error(util.format("An invalid access level [%s] was provided", accessLevel));
        }
        return val;
    };

    /**
     * Authenticates a session
     * @static
     * @method authenticateSession
     * @param {Object} session
     * @param {Object} options
     * @param {Authentication} authenticator
     * @param {Function} cb
     */
    SecurityService.authenticateSession = function(session, options, authenticator, cb){
        var doAuthentication = function(session, options, authenticator, cb) {
            authenticator.authenticate(options, function(err, user) {
                if (util.isError(err) || !util.isObject(user)) {
                    return cb(err, user);
                }

                //remove password from data to be cached
                delete user.password;

                //build out session object
                user.permissions                   = pb.PluginService.getPermissionsForRole(user.admin);
                session.authentication.user        = user;
                session.authentication.user_id     = user[pb.DAO.getIdField()].toString();
                session.authentication.admin_level = user.admin;

                //set locale if no preference already indicated for the session
                if (!session.locale) {
                    session.locale = user.locale;
                }
                cb(null, user);
            });
        };
        doAuthentication(session, options, authenticator, cb);
    };

    /**
     * Check to see if a user meets security requirements
     * @static
     * @method isAuthorized
     * @param {Object} session      [description]
     * @param {Object} requirements Object containing access requirements
     */
    SecurityService.isAuthorized = function(session, requirements) {

        //check if authentication is required
        if (requirements[SecurityService.AUTHENTICATED]) {
            if (session.authentication.user_id === null) {
                return false;
            }
        }

        //check for admin access level
        if (requirements[SecurityService.ADMIN_LEVEL] !== undefined) {
            if (session.authentication.admin_level < requirements[SecurityService.ADMIN_LEVEL]) {
                return false;
            }
        }

        //all good
        return true;
    };

    /**
     * Check to see if a session is authentic
     *
     * @method isAuthenticated
     * @param {Object} session
     */
    SecurityService.isAuthenticated = function(session) {
        if (typeof session !== 'object') {
            return false;
        }
        var reqs = {};
        reqs[SecurityService.AUTHENTICATED] = true;
        return SecurityService.isAuthorized(session, reqs);
    };

    /**
     * One way encrypt a string
     *
     * @method encrypt
     * @param {String} valStr
     * #return {String} Encrypted string
     */
    SecurityService.encrypt = function(valStr) {
        var whirlpool = crypto.createHash('whirlpool');
        whirlpool.update(valStr);
        return whirlpool.digest('hex');
    };

    /**
     * @static
     * @method generatePassword
     * @param {Integer} [length=8]
     */
    SecurityService.generatePassword = function(length) {

        //ensure a length
        if (pb.validation.isInt(length, true, true)) {
            length = 8;
        }

        var password = [];
        while(password.length < length) {
            password.push(PASSWORD_CHARS[parseInt(Math.random() * PASSWORD_CHARS.length)]);
        }
        return password.join('');
    };

    /**
     *
     * @static
     * @method getPrincipal
     * @param {Object} session
     * @return {Object} The authenticated user principal or NULL if not authenticated
     */
    SecurityService.getPrincipal = function(session) {
        if (util.isObject(session) && util.isObject(session.authentication)) {
            return session.authentication.user;
        }
        return null;
    };

    return SecurityService;
};
