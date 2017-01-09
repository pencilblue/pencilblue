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
var _ = require('lodash');
var fs   = require('fs');
var FsEntityService = require('./fs_entity_service');
var log = require('../utils/logging').newInstance('JsonFsEntityService');
var util = require('util');

/**
 * JSON file system storage service
 * TODO [1.0] check for references to see if can be removed
 * @module Services
 * @submodule Storage
 * @class JSONFSEntityService
 * @constructor
 * @param {String} objType
 */
class JsonFsEntityService extends FsEntityService {
    constructor(objType) {
        super(objType);
        this.type = 'JSONFS';
    }

    /**
     * Retrieve a value from the file system
     *
     * @method get
     * @param  {String}   key
     * @param  {Function} cb  Callback function
     */
    get(key, cb) {
        var handler = function (err, value) {
            if (_.isError(err)) {
                return cb(err, null);
            }

            try {
                cb(null, JSON.parse(value));
            }
            catch (e) {
                var error = util.format("%s: Failed to parse JSON from file: %s\n%s", this.type, key, e.stack);
                log.error(error);
                cb(new Error(error)); // PBError class necessary?
            }
        };
        super.get(key, handler);
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
        if (!_.isObject(value) && !Array.isArray(value)) {
            cb(new Error('Value must be an array or object: ' + util.inspect(value)));
        }

        try {
            value = JSON.stringify(value);
        }
        catch (e) {
            cb(e, null);
            return;
        }
        fs.writeFile(key, value, {encoding: "UTF-8"}, cb);
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

module.exports = JsonFsEntityService;
