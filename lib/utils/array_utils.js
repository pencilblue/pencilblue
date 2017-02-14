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
'use strict';

//dependencies
var _ = require('lodash');

class ArrayUtils {

    static pushAll(from, to) {
        to.push.apply(to, from);
    }

    static toLookup (array, keyConversion) {
        return ArrayUtils.toObject(array, keyConversion, function () {
            return true;
        });
    }

    static toObject (array, keyConversion, valConversion) {
        var keyConversionFunc;
        if (_.isFunction(keyConversion)) {
            keyConversionFunc = keyConversion;
        }
        else if (_.isString(keyConversion)) {
            keyConversionFunc = function (val) {
                return val[keyConversion];
            };
        }
        else {
            keyConversionFunc = function (val) {
                return val;
            };
        }

        var valConversionFunc;
        if (_.isFunction(valConversion)) {
            valConversionFunc = valConversion;
        }
        else if (_.isString(valConversion)) {
            valConversionFunc = function (val) {
                return val[valConversion];
            };
        }
        else {
            valConversionFunc = function (val) {
                return val;
            };
        }
        return array.reduce(function (returnVal, val) {
            returnVal[keyConversionFunc(val)] = valConversionFunc(val);
            return returnVal;
        }, {});
    }
}

module.exports = ArrayUtils;
