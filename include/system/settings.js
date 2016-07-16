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

module.exports = function SettingsModule(pb) {

    /**
     * SettingServiceFactory - Creates a service that will provide access to settings
     * @class SettingsServiceFactory
     * @constructor
     */
    function SettingServiceFactory(){}

    /**
     * Tracks the number of instances created
     * @private
     * @static
     * @property count
     * @type {Integer}
     */
    var count = 1;

    /**
     * The collection that contains settings
     * @private
     * @static
     * @readonly
     * @property TYPE
     * @type {String}
     */
    var TYPE = 'setting';

    /**
     * Creates a new instance of settings service with specified site, using the memory and cache settings of pb config
     *
     * @static
     * @method getServiceBySite
     * @param {String} site
     * @param {Boolean=} onlyThisSite
     */
    SettingServiceFactory.getServiceBySite = function (site, onlyThisSite) {
        if (pb.config.multisite.enabled) {
            return SettingServiceFactory.getService(pb.config.settings.use_memory, pb.config.settings.use_cache, site, onlyThisSite);
        }
        return SettingServiceFactory.getService(pb.config.settings.use_memory, pb.config.settings.use_cache);
    };

    /**
     * Creates a new instance of the settings service
     * @static
     * @method getService
     * @param {Boolean} useMemory
     * @param {Boolean} useCache
     * @return {SimpleLayeredService}
     * @param site {String} siteId
     * @param onlyThisSite {Boolean} whether this service should only return setting specified by site
     */
    SettingServiceFactory.getService = function(useMemory, useCache, site, onlyThisSite) {
        var keyField   = 'key';
        var valueField = 'value';
        var services = [];

        var options = {
            objType: TYPE,
            valueField: valueField,
            keyField: keyField,
            timeout: pb.config.settings.memory_timeout,
            site: site,
            onlyThisSite: onlyThisSite
        };

        //add in-memory service
        if (useMemory){
            services.push(new pb.MemoryEntityService(options));
        }

        //add cache service
        if (useCache) {
            services.push(new pb.CacheEntityService(options));
        }

        //always add db service
        services.push(new pb.DBEntityService(options));

        return new pb.SimpleLayeredService(services, 'SettingService' + count++);
    };

    /**
     * @method getBaseObjectService
     * @param {Object} options
     * @param {String} options.site
     * @param {Boolean} options.onlyThisSite
     */
    SettingServiceFactory.getBaseObjectService = function(options) {
        return new SettingService(options);
    };

    /**
     * @class SettingService
     * @constructor
     * @param {Object} options
     * @param {String} options.site
     * @param {Boolean} options.onlyThisSite
     */
    function SettingService(options) {

        /**
         * @property cacheService
         * @type {SimpleLayeredService}
         */
        this.cacheService = SettingServiceFactory.getServiceBySite(options.site, options.onlyThisSite);

        options.type = TYPE;
        SettingService.super_.call(this, options);
    }
    util.inherits(SettingService, pb.BaseObjectService);

    /**
     * @protected
     * @method _get
     * @param {String} id
     * @param {Object} options
     * @param {Function} cb
     */
    SettingService.prototype._get = function(id, options, cb) {
        this.cacheService.get(id, function(err, result) {
            cb(err, util.isNullOrUndefined(result) ? null : { key: id, value: result });
        });
    };

    /**
     * Constructs the where condition that uniquely identifies the DTO from the
     * persistence store.  If the clause cannot be constructed the function
     * should return null
     * @method getIdWhere
     * @param {Object} dto
     * @return {Object}
     */
    SettingService.prototype.getIdWhere = function(dto) {
        return dto.key ? { key: dto.key } : null;
    };

    /**
     * Deletes an object by key
     * @method deleteById
     * @param {String} id
     * @param {Object} options
     * @param {Function} cb
     */
    SettingService.prototype.deleteById = function(id, options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        options.where = { key: id };

        this.deleteSingle(options, cb);
    };

    /**
     * @static
     * @method afterSave
     * @param {Object} context
     * @param {Function} cb
     */
    SettingService.afterSave = function(context, cb) {
        context.service.cacheService.set(context.data.key, context.data.value, cb);
    };

    /**
     * Purges the data from the cache after it is deleted from the persistence
     * store
     * @static
     * @method afterDelete
     * @param {Object} context
     * @param {Function} cb Takes a single error, if exists
     */
    SettingService.afterDelete = function(context, cb) {
        context.service.cacheService.purge(context.data.key, cb);
    };

    /**
     * Formats the data before it is merged
     * @static
     * @method format
     * @param {Object} context
     * @param {Function} cb Takes a single error, if exists
     */
    SettingService.format = function(context, cb) {
        var dto = context.data;
        dto.key = pb.BaseController.sanitize(dto.key);
        if (util.isString(dto.value)) {
            dto.value = pb.BaseController.sanitize(dto.value);
        }
        cb(null);
    };

    /**
     *
     * @static
     * @method
     * @param {Object} context
     * @param {SettingService} service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    SettingService.merge = function(context, cb) {
        var obj = context.object;
        var dto = context.data;
        if (context.isCreate) {
            obj.key = dto.key;
        }
        obj.value = dto.value;
        cb(null);
    };

    /**
     *
     * @static
     * @method validate
     * @param {Object} context
     * @param {Object} context.data The DTO that was provided for persistence
     * @param {TopicService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    SettingService.validate = function(context, cb) {
        var obj = context.data;
        var errors = context.validationErrors;

        if (!pb.ValidationService.isNonEmptyStr(obj.key, true)) {
            errors.push(pb.BaseObjectService.validationFailure('key', 'Key is required'));

            //no need to check the DB.  Short circuit it here
            return cb(null, errors);
        }

        //validate key is not taken
        var where = { key: new RegExp('^' + util.escapeRegExp(obj.key) + '$', 'i') };
        context.service.dao.exists(TYPE, where, function(err, exists) {
            if (exists && context.isCreate) {
                errors.push(pb.BaseObjectService.validationFailure('key', 'key already exists'));
            }
            else if (!exists && context.isUpdate) {
                errors.push(pb.BaseObjectService.validationFailure('key', 'The setting should already exist'));
            }
            cb(err, errors);
        });
    };

    //registrations
    pb.BaseObjectService.on(TYPE + '.' + pb.BaseObjectService.AFTER_DELETE, SettingService.afterDelete);
    pb.BaseObjectService.on(TYPE + '.' + pb.BaseObjectService.AFTER_SAVE, SettingService.afterSave);
    pb.BaseObjectService.on(TYPE + '.' + pb.BaseObjectService.FORMAT, SettingService.format);
    pb.BaseObjectService.on(TYPE + '.' + pb.BaseObjectService.MERGE, SettingService.merge);
    pb.BaseObjectService.on(TYPE + '.' + pb.BaseObjectService.VALIDATE, SettingService.validate);

    //exports
    return SettingServiceFactory;
};
