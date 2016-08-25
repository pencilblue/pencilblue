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
var util = require('../util.js');

module.exports = function JSONFSEntityServiceModule(pb) {

    /**
     * JSON file system storage service
     *
     * @module Services
     * @submodule Storage
     * @class JSONFSEntityService
     * @constructor
     * @param {String} objType
     */
    function JSONFSEntityService(objType){
        this.type       = 'JSONFS';
        this.objType    = objType;
    }

    //inheritance
    util.inherits(JSONFSEntityService, pb.FSEntityService);

    /**
     * Retrieve a value from the file system
     *
     * @method get
     * @param  {String}   key
     * @param  {Function} cb  Callback function
     */
    JSONFSEntityService.prototype.get = function(key, cb){
        var handler = function(err, value) {
            if (util.isError(err)) {
                return cb(err, null);
            }

            try {
                cb(null, JSON.parse(value));
            }
            catch(e) {
                var error = util.format("%s: Failed to parse JSON from file: %s", this.type, key);
                pb.log.error(error);
                cb(new PBError(error).setSource(e));
            }
        };
        JSONFSEntityService.super_.prototype.render.apply([this, key, handler]);
    };

    /**
     * Set a value in the file system
     *
     * @method set
     * @param {String}   key
     * @param {*}        value
     * @param {Function} cb    Callback function
     */
    JSONFSEntityService.prototype.set = function(key, value, cb) {
        if (!util.isObject(value) && !util.isArray(value)) {
            cb(new PBError(this.type+": Value must be an array or object: "+util.inspect(value)), null);
        }

        try {
            value = JSON.stringify(value);
        }
        catch(e) {
            cb(e, null);
            return;
        }
        fs.writeFile(key, value, {encoding: "UTF-8"}, cb);
    };

    /**
     * Purge the file system of a value
     *
     * @method purge
     * @param  {String}   key
     * @param  {Function} cb  Callback function
     */
    JSONFSEntityService.prototype.purge = function(key, cb) {
        fs.unlink(key, cb);
    };

    return JSONFSEntityService;
};
