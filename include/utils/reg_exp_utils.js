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

/**
 * @class RegExpUtils
 */
class RegExpUtils {

    /**
     * The regular expression flag for saying ignore case
     * @static
     * @readonly
     * @property ANY_CHARS
     * @type {string}
     */
    static get IGNORE_CASE () {
        return 'i';
    }

    /**
     * The regular expression syntax for saying any character repeated 0 or more times
     * @static
     * @readonly
     * @property ANY_CHARS
     * @type {string}
     */
    static get ANY_CHARS () {
        return '.*';
    }

    /**
     * The regular expression syntax for saying that the match must start with the given characters
     * @static
     * @readonly
     * @property STARTS_WITH
     * @type {string}
     */
    static get STARTS_WITH () {
        return '^';
    }

    /**
     * The regular expression syntax for saying that the match must end with the given characters
     * @static
     * @readonly
     * @property STARTS_WITH
     * @type {string}
     */
    static get ENDS_WITH () {
        return '$';
    }

    /**
     * Expression used to escape a search string that may contain special characters in relation to regular expressions
     * @static
     * @readonly
     * @property ESCAPE_EXP
     * @returns {RegExp}
     */
    static get ESCAPE_EXP () {
        return /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;
    }

    /**
     * @static
     * @method escape
     * @param {string} str
     * @returns {string}
     */
    static escape (str) {
        if (typeof str !== 'string') {
            return null;
        }
        return str.replace(RegExpUtils.ESCAPE_EXP, "\\$&");
    }

    /**
     * @static
     * @method getCaseInsensitiveAny
     * @param {string} str
     * @returns {RegExp}
     */
    static getCaseInsensitiveAny (str) {
        return new RegExp(RegExpUtils.escape(str) + RegExpUtils.ANY_CHARS, RegExpUtils.IGNORE_CASE);
    }

    /**
     * @static
     * @method getCaseInsensitiveExact
     * @param {string} str
     * @returns {RegExp}
     */
    static getCaseInsensitiveExact (str) {
        return new RegExp(RegExpUtils.STARTS_WITH + RegExpUtils.escape(str) + RegExpUtils.ENDS_WITH, RegExpUtils.IGNORE_CASE);
    }
}

module.exports = RegExpUtils;
