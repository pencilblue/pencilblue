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
var fs   = require('fs');

/**
 * File system storage service
 *
 * @module Services
 * @submodule Storage
 * @class FSEntityService
 * @constructor
 * @param {String} objType
 */
class FSEntityService {
    constructor(objType) {
        this.type = 'FS';
        this.objType = objType;
    }

    /**
     * Encoding options for interacting with the file system
     * @private
     * @static
     * @readonly
     * @property FS_ENCODING_OPTS
     */
    static get FS_ENCODING_OPTS () {
        return Object.freeze({
            encoding: "UTF-8"
        });
    }

    /**
     * Retrieve a value from the file system
     *
     * @method get
     * @param  {String}   key
     * @param  {Function} cb  Callback function
     */
    get(key, cb) {
        fs.readFile(key, FSEntityService.FS_ENCODING_OPTS, cb);
    }

    /**
     * Set a value in the file system
     *
     * @method set
     * @param {String}   key
     * @param {*}        value
     * @param {Function} cb    Callback function
     */
    set(key, value, cb) {
        fs.writeFile(key, value, FSEntityService.FS_ENCODING_OPTS, cb);
    }

    /**
     * Purge the file system of a value
     *
     * @method purge
     * @param  {String}   key
     * @param  {Function} cb  Callback function
     */
    purge(key, cb) {
        fs.unlink(key, cb);
    }
}

module.exports = FSEntityService;
