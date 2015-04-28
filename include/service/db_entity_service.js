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

module.exports = function DbEntityServiceModule(pb) {
    
    /**
     * Database storage service
     *
     * @module Services
     * @submodule Storage
     * @class DbEntityService
     * @constructor
     * @param {String} objType
     * @param {String} valueField
     * @param {String} keyField
     */
    function DbEntityService(objType, valueField, keyField, site, onlyThisSite){
        this.type       = 'DB';
        this.objType    = objType;
        this.keyField   = keyField;
        this.valueField = valueField ? valueField : null;
        this.site       = site || GLOBAL_PREFIX;
        this.onlyThisSite       = onlyThisSite ? true : false;
    }

    var GLOBAL_PREFIX = 'global';
    var SITE_COLL = 'site';
    /**
     * Retrieve a value from the database
     *
     * @method get
     * @param  {String}   key
     * @param  {Function} cb  Callback function
     */
    DbEntityService.prototype.get = function(key, cb){
        var dao              = new pb.DAO();
        var where            = {};
        where[this.keyField] = key;

        var self = this;
        var callback = function(err, entity){
            if (util.isError(err)) {
                return cb(err);
            }

            //ensure setting exists
            if (!entity){
                return cb(null, null);
            }

            //get setting
            var val = self.valueField == null ? entity : entity[self.valueField];

            //callback with the result
            cb(null, val);
        };
        if(this.onlyThisSite) {
            dao.loadByValueForOneSite(this.keyField, key, this.site, this.objType, callback);
        } else {
            dao.loadByValueAvailableToSite(this.keyField, key, this.site, this.objType, callback);
        }
    };

    /**
     * Set a value in the database
     *
     * @method set
     * @param {String}   key
     * @param {*}        value
     * @param {Function} cb    Callback function
     */
    DbEntityService.prototype.set = function(key, value, cb) {
        var dao              = new pb.DAO();
        var where            = {};
        where[this.keyField] = key;

        var self = this;
        dao.loadByValueForOneSite(this.keyField, key, this.site, this.objType, function(err, result){
            if (util.isError(err)) {
                return cb(err);
            }

            //value doesn't exist in cache
            var val = null;
            if (self.valueField == null) {
                val = value;
            }
            else{
                var rawVal = null;
                if (!result) {
                    rawVal = {
                        object_type: self.objType
                    };
                    rawVal[self.keyField]   = key;
                }
                else{
                    rawVal = result;
                }
                rawVal[self.valueField] = value;
                val                     = rawVal;
            }

            //set into cache
            dao.saveToSite(val, self.site, cb);
        });
    };

    /**
     * Purge the database of a value
     *
     * @method purge
     * @param  {String}   key
     * @param  {Function} cb  Callback function
     */
    DbEntityService.prototype.purge = function(key, cb) {
        var dao              = new pb.DAO();
        var where            = {};
        where[this.keyField] = key;
        
        var hasNoSite = {};
        hasNoSite[SITE_COLL] = { $exists : false};

        var siteIsGlobal = {};
        siteIsGlobal[SITE_COLL] = GLOBAL_PREFIX;

        if(!this.site || this.site === GLOBAL_PREFIX) {
            where['$or'] = [
                hasNoSite,
                siteIsGlobal
            ];
        } else {
            where[SITE_COLL] = this.site;
        }
        dao.delete(where, this.objType, cb);
    };
    
    return DbEntityService;
};
