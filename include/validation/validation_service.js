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
 * Provides a set of functions for common validations.
 *
 * @class ValidationService
 * @constructor
 * @module Services
 * @submodule Validation
 */
function ValidationService(){}

//constants
/**
 * Pattern to validate a file name
 * @private
 * @static
 * @property
 * @type {RegExp}
 */
var FILE_NAME_SAFE_REGEX = /^[a-zA-Z0-9-_\.]+$/;

/**
 * Pattern to validate a semantic package version
 * @private
 * @static
 * @property
 * @type {RegExp}
 */
var VERSION_REGEX        = /^[0-9]+\.[0-9]+\.[0-9]+$/;

/**
 * A pattern to validate an email address
 * @private
 * @static
 * @property
 * @type {RegExp}
 */
var EMAIL_REGEX          = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/**
 * A pattern to validate a fully qualified URL
 * @private
 * @static
 * @property
 * @type {RegExp}
 */
var URL_REGEX            = /^(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;

/**
 * A pattern to validate a relative URL (no protocol, host, or port)
 * @private
 * @static
 * @property
 * @type {RegExp}
 */
var URL_REGEX_NO_HOST    = /^\/.*\/{0,1}$/;

/**
 * Validates an email address
 *
 * @method validateEmail
 * @param {String} value
 * @param {Boolean} required
 */
ValidationService.validateEmail = function(value, required) {
	if (!value && !required) {
		return true;
	}

	return pb.utils.isString(value) && value.search(EMAIL_REGEX) !== -1;
};

/**
 * Validates a version number
 *
 * @method validateVersionNum
 * @param {String} value
 * @param {Boolean} required
 */
ValidationService.validateVersionNum = function(value, required) {
	if (!value && !required) {
		return true;
	}

	return pb.utils.isString(value) && value.search(VERSION_REGEX) !== -1;
};

/**
 * Validates an URL
 *
 * @method validateUrl
 * @param {String} value
 * @param {Boolean} required
 */
ValidationService.validateUrl = function(value, required) {
	if (!value && !required) {
		return true;
	}

	return pb.utils.isString(value) && (value.search(URL_REGEX) !== -1 || value.search(URL_REGEX_NO_HOST) !== -1);
};

/**
 * Validates a file name
 *
 * @method validateSafeFileName
 * @param {String} value
 * @param {Boolean} required
 */
ValidationService.validateSafeFileName = function(value, required) {
	if (!value && !required) {
		return true;
	}

	return pb.utils.isString(value) && value.search(FILE_NAME_SAFE_REGEX) !== -1;
};

/**
 * Validates a string
 *
 * @method validateStr
 * @param {String} value
 * @param {Boolean} required
 */
ValidationService.validateStr = function(value, required) {
	if (!value && !required) {
		return true;
	}
	return pb.utils.isString(value);
};

/**
 * Validates a string is not empty
 *
 * @method validateNonEmptyStr
 * @param {String} value
 * @param {Boolean} required
 */
ValidationService.validateNonEmptyStr = function(value, required) {
	if (!value && !required) {
		return true;
	}
	return pb.utils.isString(value) && value.length > 0;
};

/**
 * Validates an array
 *
 * @method validateArray
 * @param {Array} value
 * @param {Boolean} required
 */
ValidationService.validateArray = function(value, required) {
	if (!value && !required) {
		return true;
	}
	return util.isArray(value);
};

/**
 * Validates an object
 *
 * @method validateObject
 * @param {Object} value
 * @param {Boolean} required
 */
ValidationService.validateObject = function(value, required) {
	if (!value && !required) {
		return true;
	}
	return pb.utils.isObject(value);
};

/**
 * Validates that the value is an integer.
 * @static
 * @method isInt
 * @param {Integer} val The value under test
 * @param {Boolean} [required=false] Indicates if the value is required. When
 * FALSE, null will be an acceptable value.
 * @param {Boolean} Indicates if the value must be a number rather than a string representing a number.
 * @return {Boolean} TRUE if the value is valid, FALSE if not
 */
ValidationService.isInt = function(val, required, strict) {
    if (!required && (val === null || val === undefined)) {
        return true;
    }

    var parsed = parseInt(val, 10);
    if (strict && val !== parsed) {
        return false;
    }
    return val == parsed;
};

/**
 * Validates that the value is a float.
 * @static
 * @method isFloat
 * @param {Float} val The value under test
 * @param {Boolean} [required=false] Indicates if the value is required. When
 * FALSE, null will be an acceptable value.
 * @param {Boolean} Indicates if the value must be a number rather than a string representing a number.
 * @return {Boolean} TRUE if the value is valid, FALSE if not
 */
ValidationService.isFloat = function(val, required, strict) {
    if (!required && (val === null || val === undefined)) {
        return true;
    }

    var parsed = parseFloat(val, 10);
    if (strict && val !== parsed) {
        return false;
    }
    return val == parsed;
}

//exports
module.exports = ValidationService;
