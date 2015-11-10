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

/**
 * Services for managing storage
 *
 * @submodule Storage
 */
module.exports = function CacheEntityServiceModule(pb) {
    
    /**
     * In-cache storage service
     *
     * @module Services
     * @class CacheEntityService
     * @constructor
     * @param {String} [objType]
     * @param {String} [valueField]
     * @param {String} [keyField]
     * @param {Integer} The number of seconds that a value will remain in cache 
     * before expiry.
     */
    function CacheEntityService(objType, valueField, keyField, timeout){
        this.type       = 'Cache';
        this.objType    = objType;
        this.keyField   = keyField;
        this.timeout    = timeout || 0;
        this.valueField = valueField ? valueField : null;
    }

    /**
     * Retrieve a value from the cache
     *
     * @method get
     * @param  {String}   key
     * @param  {Function} cb  Callback function
     */
    CacheEntityService.prototype.get = function(key, cb){

        var self = this;
        pb.cache.get(key, function(err, result){
            if (util.isError(err)) {
                return cb(err, null);
            }

            //value doesn't exist in cache
            if (result == null) {
                return cb(null, null);
            }

            //value exists
            var val = result;
            if (self.valueField != null){
                var rawVal = JSON.parse(result);
                val        = rawVal[self.valueField];
            }
            else {
                try{
                    val = JSON.parse(val);
                }
                catch(e) {
                    pb.log.error('CacheEntityService: an unparcable value was provided to the cache service. Type=%s Value=%s', self.objType, val);
                }
            }

            //make call back
            cb(null, val);
        });
    };

    /**
     * Set a value in the cache
     *
     * @method set
     * @param {String}   key
     * @param {*}        value
     * @param {Function} cb    Callback function
     */
    CacheEntityService.prototype.set = function(key, value, cb) {
        var self = this;
        pb.cache.get(key, function(err, result){
            if (util.isError(err)) {
                return cb(err, null);
            }

            //value doesn't exist in cache
            var val = null;
            if (self.valueField == null) {
                val = value;
                
                if (util.isObject(val)) {
                    val = JSON.stringify(val);
                }
            }
            else{
                var rawVal = null;
                if (result == null) {
                    rawVal = {
                        object_type: this.objType
                    };
                    rawVal[self.keyField]   = key;
                }
                else{
                    rawVal = JSON.parse(result);
                }
                rawVal[self.valueField] = value;
                val                     = JSON.stringify(rawVal);
            }

            //set into cache
            if (self.timeout) {
                pb.cache.setex(key, self.timeout, val, cb);
            }
            else {
                pb.cache.set(key, val, cb);
            }
        });
    };

    /**
     * Purge the cache of a value
     *
     * @method purge
     * @param  {String}   key
     * @param  {Function} cb  Callback function
     */
    CacheEntityService.prototype.purge = function(key, cb) {
        pb.cache.del(key, cb);
    };
    
    return CacheEntityService;
};
