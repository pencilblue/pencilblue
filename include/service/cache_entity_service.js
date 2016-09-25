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
     * @param {Object} options
     * @param {String} options.objType
     * @param {String} options.keyField
     * @param {String} [options.valueField=null]
     * @param {String} [options.site=GLOBAL_SITE]
     * @param {String} [options.onlyThisSite=false]
     * @param {Integer} [options.timeout=0] The number of seconds that a value will remain in cache
     * before expiry.
     */
    function CacheEntityService(options){

        this.objType = options.objType;
        this.keyField = options.keyField;
        this.valueField = options.valueField ? options.valueField : null;
        this.site = options.site || GLOBAL_SITE;
        this.onlyThisSite = !!options.onlyThisSite;
        this.timeout = options.timeout || 0;
        this.type = 'Cache-'+this.site+'-'+this.onlyThisSite;
    }

    /**
     * Short reference to SiteService.GLOBAL_SITE
     * @private
     * @static
     * @readonly
     * @property GLOBAL_SITE
     * @type {String}
     */
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
                return cb(err, null);
            }

            //site specific value doesn't exist in cache
            if (result == null) {

                if (self.site === GLOBAL_SITE || self.onlyThisSite) {
                    return cb(null, null);
                }

                pb.cache.get(keyValue(key, GLOBAL_SITE), function(err, result){
                    if (util.isError(err)) {
                        return cb(err, null);
                    }

                    //value doesn't exist in cache
                    if (result == null) {
                        return cb(null, null);
                    }

                    //make call back
                    return cb(null, self.getRightFieldFromValue(result, self.valueField));
                });
            }
            else {
                //make call back
                return cb(null, self.getRightFieldFromValue(result, self.valueField));
            }
        });
    };

    CacheEntityService.prototype.getRightFieldFromValue = function(result, valueField) {
        var val = result;
        if (valueField != null){
            var rawVal = JSON.parse(result);
            val        = rawVal[valueField];
        }
        else {
            try{
                val = JSON.parse(val);
            }
            catch(e) {
                pb.log.error('CacheEntityService: an unparcable value was provided to the cache service. Type=%s Value=%s', this.objType, val);
            }
        }
        return val;
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
        pb.cache.get(keyValue(key, this.site), function(err, result){
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
