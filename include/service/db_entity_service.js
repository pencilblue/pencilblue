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
var DAO = require('../dao/dao');
var log = require('../utils/logging').newInstance('DbEntityService');
var SiteQueryService = require('./entities/site_query_service');
var SiteService = require('./entities/site_service');

/**
 * Database storage service
 *
 * @module Services
 * @submodule Storage
 * @class DbEntityService
 * @constructor
 * @param {Object} options
 * @param {String} options.objType
 * @param {String} options.keyField
 * @param {String} [options.valueField=null]
 * @param {String} [options.site='global']
 * @param {String} [options.onlyThisSite=false]
 */
function DbEntityService(options){

    this.objType = options.objType;
    this.keyField = options.keyField;
    this.valueField = options.valueField ? options.valueField : null;
    this.site = options.site || SiteService.GLOBAL_SITE;
    this.onlyThisSite = !!options.onlyThisSite;
    this.type = 'DB-'+this.site+'-'+this.onlyThisSite;
    this.sqs = new SiteQueryService({site: this.site, onlyThisSite: this.onlyThisSite});
}

/**
 * Retrieve a value from the database
 *
 * @method get
 * @param  {String}   key
 * @param  {Function} cb  Callback function
 */
DbEntityService.prototype.get = function(key, cb){
    var self = this;
    var callback = function(err, entity){
        if (_.isError(err)) {
            return cb(err);
        }

        //ensure setting exists
        if (!entity){
            return cb(null, null);
        }

        //get setting
        var val = self.valueField === null ? entity : entity[self.valueField];

        //callback with the result
        cb(null, val);
    };

    this.sqs.loadByValue(this.keyField, key, this.objType, null, callback);

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
    var self = this;
    this.sqs.loadByValue(this.keyField, key, this.objType, function(err, result){
        if (_.isError(err)) {
            log.error('loadByValue encountered an error. ERROR[%s]', err.stack);
            return cb(err);
        }

        //value doesn't exist in cache
        var val = null;
        if (self.valueField === null) {
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
        self.sqs.save(val, cb);
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
    var dao              = new DAO();
    var where            = {};
    where[this.keyField] = key;

    var hasNoSite = {};
    hasNoSite[SiteService.SITE_FIELD] = { $exists : false};

    var siteIsGlobal = {};
    siteIsGlobal[SiteService.SITE_FIELD] = SiteService.GLOBAL_SITE;

    if(!this.site || this.site === SiteService.GLOBAL_SITE) {
        where.$or = [
            hasNoSite,
            siteIsGlobal
        ];
    } else {
        where[SiteService.SITE_FIELD] = this.site;
    }
    dao.delete(where, this.objType, cb);
};

module.exports = DbEntityService;
