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
var fs   = require('fs');
var util = require('../util.js');

module.exports = function FSEntityServiceModule(/*pb*/) {
    
    /**
     * Encoding options for interacting with the file system
     * @private
     * @static
     * @readonly
     * @property FS_ENCODING_OPTS
     */
    var FS_ENCODING_OPTS = Object.freeze({
        encoding: "UTF-8"
    });

    /**
     * File system storage service
     *
     * @module Services
     * @submodule Storage
     * @class FSEntityService
     * @constructor
     * @param {String} objType
     */
    function FSEntityService(objType){
        this.type       = 'FS';
        this.objType    = objType;
    }

    /**
     * Retrieve a value from the file system
     *
     * @method get
     * @param  {String}   key
     * @param  {Function} cb  Callback function
     */
    FSEntityService.prototype.get = function(key, cb){
        fs.readFile(key, FS_ENCODING_OPTS, cb);
    };

    /**
     * Set a value in the file system
     *
     * @method set
     * @param {String}   key
     * @param {*}        value
     * @param {Function} cb    Callback function
     */
    FSEntityService.prototype.set = function(key, value, cb) {
        fs.writeFile(key, value, FS_ENCODING_OPTS, cb);
    };

    /**
     * Purge the file system of a value
     *
     * @method purge
     * @param  {String}   key
     * @param  {Function} cb  Callback function
     */
    FSEntityService.prototype.purge = function(key, cb) {
        fs.unlink(key, cb);
    };

    return FSEntityService;
};
