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
var _        = require('lodash');
var semver   = require('semver');

/**
 * Provides a set of functions for common validations.
 */
class ValidationService {

    //constants
    /**
     * Pattern to validate a file name
     * @readonly
     * @type {RegExp}
     */
    static get FILE_NAME_SAFE_REGEX() {
        return /^[a-zA-Z0-9-_\.]+$/;
    }

    /**
     * Pattern to validate a semantic package version
     * @readonly
     * @type {RegExp}
     */
    static get VERSION_REGEX() {
        return /^[0-9]+\.[0-9]+\.[0-9]+$/;
    }

    /**
     * A pattern to validate an email address
     * @readonly
     * @type {RegExp}
     */
    static get EMAIL_REGEX() {
        return /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
    }

    /**
     * A pattern to validate a fully qualified URL
     * @readonly
     * @type {RegExp}
     */
    static get URL_REGEX() {
        return /^(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;
    }

    /**
     * A pattern to validate a relative URL (no protocol, host, or port)
     * @readonly
     * @type {RegExp}
     */
    static get URL_REGEX_NO_HOST() {
        return /^\/.*\/{0,1}$/;
    }

    /**
     * Checks to see if the value is a valid ID string
     * @param {String} val The value under test
     * @param {Boolean} [required=false] Indicates if the value is required. When
     * FALSE, null will be an acceptable value.
     * @return {Boolean} TRUE if the value is valid, FALSE if not
     */
    static isIdStr(val, required) {
        if (!required && (val === null || val === undefined)) {
            return true;
        }
        else if (!_.isString(val)) {
            return false;
        }
        return ValidationService.isId(val, required);
    }

    /**
     * Validates an email address
     * @param {String} value
     * @param {Boolean} [required=false]
     */
    static isEmail(value, required) {
        if (!value && !required) {
            return true;
        }

        return _.isString(value) && value.search(ValidationService.EMAIL_REGEX) !== -1;
    }

    /**
     * Validates a version number
     * @param {String} value
     * @param {Boolean} [required=false]
     */
    static isVersionNum(value, required) {
        if (!value && !required) {
            return true;
        }

        return _.isString(value) && value.search(ValidationService.VERSION_REGEX) !== -1;
    }

    /**
     * Validates a version expression
     * @param {String} expression
     * @param {Boolean} [required=false]
     */
    static isVersionExpression(expression, required) {
        if (!expression && !required) {
            return true;
        }
        return semver.validRange(expression) !== null;
    }

    /**
     * Validates an URL
     * @param {String} value
     * @param {Boolean} [required=false]
     */
    static isUrl(value, required) {
        if (!value && !required) {
            return true;
        }

        return _.isString(value) && (value.search(ValidationService.URL_REGEX) !== -1 || value.search(ValidationService.URL_REGEX_NO_HOST) !== -1);
    }

    /**
     * Validates a file name
     * @param {String} value
     * @param {Boolean} [required=false]
     */
    static isSafeFileName(value, required) {
        if (!value && !required) {
            return true;
        }

        return _.isString(value) && value.search(ValidationService.FILE_NAME_SAFE_REGEX) !== -1;
    }

    /**
     * Validates a string
     * @param {String} value
     * @param {Boolean} [required=false]
     */
    static isStr(value, required) {
        if (!value && !required) {
            return true;
        }
        return _.isString(value);
    }

    /**
     * Validates a string is not empty
     * @param {String} value
     * @param {Boolean} [required=false]
     */
    static isNonEmptyStr(value, required) {
        if (!value && !required) {
            return true;
        }
        return _.isString(value) && value.length > 0;
    }

    /**
     * Validates an array
     * @param {Array} value
     * @param {Boolean} [required=false]
     */
    static isArray(value, required) {
        if (!value && !required) {
            return true;
        }
        return Array.isArray(value);
    }

    /**
     * Validates an object
     * @param {Object} value
     * @param {Boolean} [required=false]
     */
    static isObj(value, required) {
        if (!value && !required) {
            return true;
        }
        return _.isObject(value);
    }

    /**
     * Validates that the value is an integer.
     * @param {Integer} val The value under test
     * @param {Boolean} [required=false] Indicates if the value is required. When
     * FALSE, null will be an acceptable value.
     * @param {Boolean} strict Indicates if the value must be a number rather than a string representing a number.
     * @return {Boolean} TRUE if the value is valid, FALSE if not
     */
    static isInt(val, required, strict) {
        if (!required && (val === null || val === undefined)) {
            return true;
        }

        var parsed = parseInt(val, 10);
        if (strict && val !== parsed) {
            return false;
        }
        return val === parsed;
    }

    /**
     * Validates that the value is a float.
     * @param {*} val The value under test
     * @param {Boolean} [required=false] Indicates if the value is required. When
     * FALSE, null will be an acceptable value.
     * @param {Boolean} strict Indicates if the value must be a number rather than a string representing a number.
     * @return {Boolean} TRUE if the value is valid, FALSE if not
     */
    static isFloat(val, required, strict) {
        if (!required && (val === null || val === undefined)) {
            return true;
        }

        var parsed = parseFloat(val);
        if ((Math.floor(parsed) === val) || (strict && val !== parsed)) {
            return false;
        }
        return val === parsed;
    }

    /**
     * Validates that the value is a number.
     * @param {*} val The value under test
     * @param {Boolean} [required=false] Indicates if the value is required. When
     * FALSE, null will be an acceptable value.
     * @return {Boolean} TRUE if the value is valid, FALSE if not
     */
    static isNum(val, required) {
        if (!required && (val === null || val === undefined)) {
            return true;
        }

        return !isNaN(val);
    }

    /**
     * Validates that the value is a boolean.
     * @param {*} val The value under test
     * @return {Boolean} TRUE if the value is valid, FALSE if not
     */
    static isBool(val) {
        return _.isBoolean(val);
    }

    /**
     * Validates that the value is null, defined, an empty object, and empty
     * array or an empty string.
     * @param {*} val The value under test
     * @return {Boolean} TRUE if the value is valid, FALSE if not
     */
    static isEmpty(val) {
        return val === null || val === undefined || val === '' || _.isEqual(val, {}) || _.isEqual(val, []);
    }

    /**
     * Validates that the value is a date object
     * @param {*} val The value under test
     * @param {boolean} [required=false]
     * @return {Boolean} TRUE if the value is valid, FALSE if not
     */
    static isDate(val, required) {
        if (!required && (val === null || val === undefined)) {
            return true;
        }
        return _.isDate(val) && !isNaN(val.getTime());
    }
}

    module.exports = ValidationService;
