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
var semver   = require('semver');
var ObjectID = require('mongodb').ObjectID;
var util     = require('../util.js');

module.exports = function ValidationModule(pb) {

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
     * Checks to see if the value is a valid ID string
     * @static
     * @method isIdStr
     * @param {String} val The value under test
     * @param {Boolean} [required=false] Indicates if the value is required. When
     * FALSE, null will be an acceptable value.
     * @return {Boolean} TRUE if the value is valid, FALSE if not
     */
    ValidationService.isIdStr = function(val, required) {
        if (!required && (val === null || val === undefined)) {
            return true;
        }
        else if (!util.isString(val)) {
            return false;
        }
        return ValidationService.isId(val, required);
    };

    /**
     * Checks to see if the value is a valid ID string or an instance of ObjectID.
     * @static
     * @method isId
     * @param {String|ObjectID} val The value under test
     * @param {Boolean} [required=false] Indicates if the value is required. When
     * FALSE, null will be an acceptable value.
     * @return {Boolean} TRUE if the value is valid, FALSE if not
     */
    ValidationService.isId = function(val, required) {
        if (!required && (val === null || val === undefined)) {
            return true;
        }

        var id = pb.DAO.getObjectId(val);
        return id instanceof ObjectID;
    };

    /**
     * Validates an email address
     *
     * @method validateEmail
     * @param {String} value
     * @param {Boolean} required
     */
    ValidationService.validateEmail = function(value, required) {
        return ValidationService.isEmail(value, required);
    };

    /**
     * Validates an email address
     *
     * @method isEmail
     * @param {String} value
     * @param {Boolean} required
     */
    ValidationService.isEmail = function(value, required) {
        if (!value && !required) {
            return true;
        }

        return util.isString(value) && value.search(EMAIL_REGEX) !== -1;
    };

    /**
     * Validates a version number
     * @deprecated
     * @method validateVersionNum
     * @param {String} value
     * @param {Boolean} required
     */
    ValidationService.validateVersionNum = function(value, required) {
        return ValidationService.isVersionNum(value, required);
    };

    /**
     * Validates a version number
     *
     * @method isVersionNum
     * @param {String} value
     * @param {Boolean} required
     */
    ValidationService.isVersionNum = function(value, required) {
        if (!value && !required) {
            return true;
        }

        return util.isString(value) && value.search(VERSION_REGEX) !== -1;
    };

    /**
     * Validates a version expression
     *
     * @method isVersionExpression
     * @param {String} expression
     * @param {Boolean} required
     */
    ValidationService.isVersionExpression = function(expression, required) {
        if (!expression && !required) {
            return true;
        }
        return semver.validRange(expression) !== null;
    };

    /**
     * Validates an URL
     * @deprecated
     * @method validateUrl
     * @param {String} value
     * @param {Boolean} required
     */
    ValidationService.validateUrl = function(value, required) {
        return ValidationService.isUrl(value, required);
    };

    /**
     * Validates an URL
     *
     * @method isUrl
     * @param {String} value
     * @param {Boolean} required
     */
    ValidationService.isUrl = function(value, required) {
        if (!value && !required) {
            return true;
        }

        return util.isString(value) && (value.search(URL_REGEX) !== -1 || value.search(URL_REGEX_NO_HOST) !== -1);
    };

    /**
     * Validates a file name
     * @deprecated
     * @method validateSafeFileName
     * @param {String} value
     * @param {Boolean} required
     */
    ValidationService.validateSafeFileName = function(value, required) {
        return ValidationService.isSafeFileName(value, required);
    };

    /**
     * Validates a file name
     *
     * @method isSafeFileName
     * @param {String} value
     * @param {Boolean} required
     */
    ValidationService.isSafeFileName = function(value, required) {
        if (!value && !required) {
            return true;
        }

        return util.isString(value) && value.search(FILE_NAME_SAFE_REGEX) !== -1;
    };

    /**
     * Validates a string
     * @deprecated
     * @method validateStr
     * @param {String} value
     * @param {Boolean} required
     */
    ValidationService.validateStr = function(value, required) {
        return ValidationService.isStr(value, required);
    };

    /**
     * Validates a string
     *
     * @method isStr
     * @param {String} value
     * @param {Boolean} required
     */
    ValidationService.isStr = function(value, required) {
        if (!value && !required) {
            return true;
        }
        return util.isString(value);
    };

    /**
     * Validates a string is not empty
     * @deprecated
     * @method validateNonEmptyStr
     * @param {String} value
     * @param {Boolean} required
     */
    ValidationService.validateNonEmptyStr = function(value, required) {
        return ValidationService.isNonEmptyStr(value, required);
    };

    /**
     * Validates a string is not empty
     *
     * @method isNonEmptyStr
     * @param {String} value
     * @param {Boolean} required
     */
    ValidationService.isNonEmptyStr = function(value, required) {
        if (!value && !required) {
            return true;
        }
        return util.isString(value) && value.length > 0;
    };

    /**
     * Validates an array
     * @deprecated
     * @method validateArray
     * @param {Array} value
     * @param {Boolean} required
     */
    ValidationService.validateArray = function(value, required) {
        return ValidationService.isArray(value, required);
    };

    /**
     * Validates an array
     *
     * @method isArray
     * @param {Array} value
     * @param {Boolean} required
     */
    ValidationService.isArray = function(value, required) {
        if (!value && !required) {
            return true;
        }
        return util.isArray(value);
    };

    /**
     * Validates an object
     * @deprecated
     * @method validateObject
     * @param {Object} value
     * @param {Boolean} required
     */
    ValidationService.validateObject = function(value, required) {
        return ValidationService.isObj(value, required);
    };

    /**
     * Validates an object
     *
     * @method isObject
     * @param {Object} value
     * @param {Boolean} [required=false]
     */
    ValidationService.isObj = function(value, required) {
        if (!value && !required) {
            return true;
        }
        return util.isObject(value);
    };

    /**
     * Validates that the value is an integer.
     * @static
     * @method isInt
     * @param {Integer} val The value under test
     * @param {Boolean} [required=false] Indicates if the value is required. When
     * FALSE, null will be an acceptable value.
     * @param {Boolean} strict Indicates if the value must be a number rather than a string representing a number.
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
     * @param {Number} val The value under test
     * @param {Boolean} [required=false] Indicates if the value is required. When
     * FALSE, null will be an acceptable value.
     * @param {Boolean} strict Indicates if the value must be a number rather than a string representing a number.
     * @return {Boolean} TRUE if the value is valid, FALSE if not
     */
    ValidationService.isFloat = function(val, required, strict) {
        if (!required && (val === null || val === undefined)) {
            return true;
        }

        var parsed = parseFloat(val);
        if (strict && val !== parsed) {
            return false;
        }
        return val == parsed;
    };

    /**
     * Validates that the value is a number.
     * @static
     * @method isNum
     * @param {Number} val The value under test
     * @param {Boolean} [required=false] Indicates if the value is required. When
     * FALSE, null will be an acceptable value.
     * @return {Boolean} TRUE if the value is valid, FALSE if not
     */
    ValidationService.isNum = function(val, required) {
        if (!required && (val === null || val === undefined)) {
            return true;
        }

        return !isNaN(val);
    };

    /**
     * Validates that the value is a boolean.
     * @static
     * @method isBool
     * @param {Boolean} val The value under test
     * @return {Boolean} TRUE if the value is valid, FALSE if not
     */
    ValidationService.isBool = function(val) {
        return util.isBoolean(val);
    };

    /**
     * Validates that the value is null, defined, an empty object, or an empty
     * string.
     * @static
     * @method isEmpty
     * @param {*} val The value under test
     * @return {Boolean} TRUE if the value is valid, FALSE if not
     */
    ValidationService.isEmpty = function(val) {
        return val === null || val === undefined || val === '' || val === {};
    };

    /**
     * Validates that the value is a date object
     * @static
     * @method isDate
     * @param {Date} val The value under test
     * @param {boolean} [required=false]
     * @return {Boolean} TRUE if the value is valid, FALSE if not
     */
    ValidationService.isDate = function(val, required) {
        if (!required && (val === null || val === undefined)) {
            return true;
        }
        return util.isDate(val) && !isNaN(val.getTime());
    };

    return ValidationService;
};
