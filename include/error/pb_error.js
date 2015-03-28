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
var util = require('../util.js');

module.exports = function PBErrorModule(pb) {

    /**
     * Specialized application error that knows what status code to return
     *
     * @module ErrorSuccess
     * @class PBError
     * @constructor
     * @main ErrorSuccess
     * @param {String} message    The error message
     * @param {Number} httpStatus The header code for the error
     */
    function PBError(message, httpStatus) {
        this.message         = message ? message : '';
        this.httpStatus      = httpStatus ? httpStatus : 500;
        this.localizationKey = null;
        this.source          = null;
    };

    //setup inheritance
    util.inherits(PBError, Error);

    /**
     * Sets the localization key for the error
     *
     * @method setLocalizationKey
     * @param {String} key The localization key
     * @return {object}    The PBError object
     */
    PBError.prototype.setLocalizatonKey = function(key){
        this.localizationKey = key;
        return this;
    };

    /**
     * Sets the source for the error
     *
     * @method setSource
     * @param {Object} err The error source
     * @return {object}    The PBError object
     */
    PBError.prototype.setSource = function(err){
        this.source = err;
        return this;
    };

    return PBError;
};
