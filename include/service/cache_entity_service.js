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
     * @param {String} objType
     * @param {String} valueField
     * @param {String} keyField
     */
    function CacheEntityService(objType, valueField, keyField, site, onlyThisSite){
        this.type       = 'Cache';
        this.objType    = objType;
        this.keyField   = keyField;
        this.valueField = valueField ? valueField : null;
        this.site = site || GLOBAL_SITE;
        this.onlyThisSite = onlyThisSite ? true : false;
    }

    var GLOBAL_SITE = pb.SiteService.GLOBAL_SITE;

    /**
     * Retrieve a value from the cache
     *
     * @method get
     * @param  {String}   key
     * @param  {Function} cb  Callback function
     */
    CacheEntityService.prototype.get = function(key, cb){

        var self = this;
        pb.cache.get(keyValue(key, this.site), function(err, result){
            if (util.isError(err)) {
                cb(err, null);
                return;
            }

            //site specific value doesn't exist in cache
            if (result == null) {
                if(self.site !== GLOBAL_SITE && !self.onlyThisSite) {
                    pb.cache.get(keyValue(key, GLOBAL_SITE), function(err, result){
                        if (util.isError(err)) {
                            cb(err, null);
                            return;
                        }

                        //value doesn't exist in cache
                        if (result == null) {
                            cb(null, null);
                            return;
                        }

                        //make call back
                        cb(null, getRightFieldFromValue(result, self.valueField));
                    });
                } else {
                    cb(null, null);
                }
                return;
            }

            //make call back
            cb(null, getRightFieldFromValue(result, self.valueField));
        });
    };

    function getRightFieldFromValue(result, valueField) {
        var val = result;
        if (valueField != null){
            var rawVal = JSON.parse(result);
            val        = rawVal[valueField];
        }
        return val;
    }

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
        pb.cache.get(keyValue(key, this.site), function(err, result){
            if (util.isError(err)) {
                cb(err, null);
                return;
            }

            //value doesn't exist in cache
            var val = null;
            if (self.valueField == null) {
                val = value;
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
            pb.cache.set(key, val, cb);
        });
    };

    function keyValue(key, site) {
        return site + '_' + key;
    }

    /**
     * Purge the cache of a value
     *
     * @method purge
     * @param  {String}   key
     * @param  {Function} cb  Callback function
     */
    CacheEntityService.prototype.purge = function(key, cb) {
        pb.cache.del(keyValue(key, this.site), cb);
    };
    
    return CacheEntityService;
};
