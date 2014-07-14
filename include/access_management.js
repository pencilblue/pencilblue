/*
    Copyright (C) 2014  PencilBlue, LLC

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

/**
 * Service for managing user access
 *
 * @module Services
 * @submodule Security
 * @class SecurityService
 * @constructor
 */
function SecurityService(){}

//constants
global.ACCESS_USER            = 0;
global.ACCESS_WRITER          = 1;
global.ACCESS_EDITOR          = 2;
global.ACCESS_MANAGING_EDITOR = 3;
global.ACCESS_ADMINISTRATOR   = 4;

var PASSWORD_CHARS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '!', '@', '#', '$', '%', '^', '&', '*', '?'];

SecurityService.AUTHENTICATED = 'authenticated';
SecurityService.ADMIN_LEVEL   = 'admin_level';

/**
 * Retrieves the localized names of access levels
 *
 * @method getRoleNames
 * @param {Object} ls The localization service
 */
SecurityService.getRoleNames = function(ls) {
	var map = SecurityService.getRoleToDisplayNameMap(ls);
	return pb.utils.hashToArray(map);
};

SecurityService.getRoleToDisplayNameMap = function(ls) {
	if (ls && typeof ls.get === 'function') {
		return {
			'ACCESS_USER': ls.get('ACCESS_USER'),
	        'ACCESS_WRITER': ls.get('ACCESS_WRITER'),
	        'ACCESS_EDITOR': ls.get('ACCESS_EDITOR'),
	        'ACCESS_MANAGING_EDITOR': ls.get('ACCESS_MANAGING_EDITOR'),
	        'ACCESS_ADMINISTRATOR': ls.get('ACCESS_ADMINISTRATOR'),
		};
	}
	return null;
};

/**
 * Returns the constant name of an access level number
 *
 * @method getRoleName
 * @param {Number} accessLevel
 */
SecurityService.getRoleName = function(accessLevel) {
	switch(accessLevel) {
	case ACCESS_USER:
		return 'ACCESS_USER';
	case ACCESS_WRITER:
		return 'ACCESS_WRITER';
	case ACCESS_EDITOR:
		return 'ACCESS_EDITOR';
	case ACCESS_MANAGING_EDITOR:
		return 'ACCESS_MANAGING_EDITOR';
	case ACCESS_ADMINISTRATOR:
		return 'ACCESS_ADMINISTRATOR';
	default:
		throw new PBError(util.format("An invalid access level [%s] was provided", accessLevel), 500);
	}
};

SecurityService.authenticateSession = function(session, options, authenticator, cb){
	var doAuthentication = function(session, options, authenticator, cb) {
		authenticator.authenticate(options, function(err, user) {
			if (util.isError(err) || user == null) {
				cb(err, user);
				return;
			}

			//remove password from data to be cached
	        delete user.password;

	        //build out session object
	        user.permissions                   = pb.PluginService.getPermissionsForRole(user.admin);
	        session.authentication.user        = user;
	        session.authentication.user_id     = user._id.toString();
	        session.authentication.admin_level = user.admin;
	        cb(null, user);
		});
	};
	doAuthentication(session, options, authenticator, cb);
};

/**
 * Check to see if a user meets security requirements
 *
 * @method isAuthorized
 * @param {Object} session      [description]
 * @param {Object} requirements Object containing access requirements
 */
SecurityService.isAuthorized = function(session, requirements) {

	//check if authentication is required
	if (requirements[SecurityService.AUTHENTICATED]) {
		if (session.authentication.user_id == null) {
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
 * @param {String} valString
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

//exports
module.exports.SecurityService = SecurityService;
