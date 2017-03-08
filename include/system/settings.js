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
var BaseObjectService = require('../service/base_object_service');
var CacheEntityService = require('../service/cache_entity_service');
var Configuration = require('../config');
var DbEntityService = require('../service/db_entity_service');
var MemoryEntityService = require('../service/memory_entity_service');
var RegExpUtils = require('../utils/reg_exp_utils');
var SimpleLayeredService = require('../service/simple_layered_service');
var ValidationService = require('../validation/validation_service');

/**
 * Tracks the number of instances created
 * @private
 * @static
 * @property count
 * @type {Integer}
 */
var count = 1;

/**
 * SettingServiceFactory - Creates a service that will provide access to settings
 * @class SettingsServiceFactory
 * @constructor
 */
class SettingServiceFactory {

    /**
     * Creates a new instance of settings service with specified site, using the memory and cache settings of pb config
     *
     * @static
     * @method getServiceBySite
     * @param {String} site
     * @param {Boolean=} onlyThisSite
     */
    static getServiceBySite(site, onlyThisSite) {
        if (Configuration.active.multisite.enabled) {
            return SettingServiceFactory.getService(Configuration.active.settings.use_memory, Configuration.active.settings.use_cache, site, onlyThisSite);
        }
        return SettingServiceFactory.getService(Configuration.active.settings.use_memory, Configuration.active.settings.use_cache);
    }

    /**
     * Creates a new instance of the settings service
     * @param {Boolean} useMemory
     * @param {Boolean} useCache
     * @param {String} site  siteId
     * @param {Boolean} [onlyThisSite=false]  whether this service should only return setting specified by site
     * @return {SimpleLayeredService}
     */
    static getService(useMemory, useCache, site, onlyThisSite) {
        var keyField = 'key';
        var valueField = 'value';
        var services = [];

        var options = {
            objType: SettingService.TYPE,
            valueField: valueField,
            keyField: keyField,
            timeout: Configuration.active.settings.memory_timeout,
            site: site,
            onlyThisSite: !!onlyThisSite
        };

        //add in-memory service
        if (useMemory) {
            services.push(new MemoryEntityService(options));
        }

        //add cache service
        if (useCache) {
            services.push(new CacheEntityService(options));
        }

        //always add db service
        services.push(new DbEntityService(options));

        return new SimpleLayeredService(services, 'SettingService' + count++);
    }

    /**
     * @method getBaseObjectService
     * @param {Object} options
     * @param {String} options.site
     * @param {Boolean} options.onlyThisSite
     */
    static getBaseObjectService(options) {
        return new SettingService(options);
    }
}

/**
 * @class SettingService
 * @constructor
 * @param {Object} options
 * @param {String} options.site
 * @param {Boolean} options.onlyThisSite
 */
class SettingService extends BaseObjectService {
    constructor(options) {

        /**
         * @property cacheService
         * @type {SimpleLayeredService}
         */
        this.cacheService = SettingServiceFactory.getServiceBySite(options.site, options.onlyThisSite);

        options.type = SettingService.TYPE;
        super(options);
    }

    /**
     * The collection that contains settings
     * @readonly
     * @type {String}
     */
    static get TYPE() {
        return 'setting';
    }

    /**
     * @protected
     * @method _get
     * @param {String} id
     * @param {Object} options
     * @param {Function} cb
     */
    _get(id, options, cb) {
        this.cacheService.get(id, function (err, result) {
            cb(err, _.isNil(result) ? null : {key: id, value: result});
        });
    }

    /**
     * Constructs the where condition that uniquely identifies the DTO from the
     * persistence store.  If the clause cannot be constructed the function
     * should return null
     * @method getIdWhere
     * @param {Object} dto
     * @return {Object}
     */
    getIdWhere(dto) {
        return dto.key ? {key: dto.key} : null;
    }

    /**
     * Deletes an object by key
     * @method deleteById
     * @param {String} id
     * @param {Object} options
     * @param {Function} cb
     */
    deleteById(id, options, cb) {
        if (_.isFunction(options)) {
            cb = options;
            options = {};
        }
        options.where = {key: id};

        this.deleteSingle(options, cb);
    }

    /**
     * @static
     * @method afterSave
     * @param {Object} context
     * @param {Function} cb
     */
    static afterSave(context, cb) {
        context.service.cacheService.set(context.data.key, context.data.value, cb);
    }

    /**
     * Purges the data from the cache after it is deleted from the persistence
     * store
     * @static
     * @method afterDelete
     * @param {Object} context
     * @param {Function} cb Takes a single error, if exists
     */
    static afterDelete(context, cb) {
        context.service.cacheService.purge(context.data.key, cb);
    }

    /**
     * Formats the data before it is merged
     * @static
     * @method format
     * @param {Object} context
     * @param {Function} cb Takes a single error, if exists
     */
    static format(context, cb) {
        var dto = context.data;
        dto.key = BaseObjectService.sanitize(dto.key);
        if (_.isString(dto.value)) {
            dto.value = BaseObjectService.sanitize(dto.value);
        }
        cb(null);
    }

    /**
     *
     * @static
     * @method
     * @param {Object} context
     * @param {SettingService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    static merge(context, cb) {
        var obj = context.object;
        var dto = context.data;
        if (context.isCreate) {
            obj.key = dto.key;
        }
        obj.value = dto.value;
        cb(null);
    }

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
    static validate(context, cb) {
        var obj = context.data;
        var errors = context.validationErrors;

        if (!ValidationService.isNonEmptyStr(obj.key, true)) {
            errors.push(BaseObjectService.validationFailure('key', 'Key is required'));

            //no need to check the DB.  Short circuit it here
            return cb(null, errors);
        }

        //validate key is not taken
        var where = {key: RegExpUtils.getCaseInsensitiveExact(obj.key)};
        context.service.dao.exists(SettingService.TYPE, where, function (err, exists) {
            if (exists && context.isCreate) {
                errors.push(BaseObjectService.validationFailure('key', 'key already exists'));
            }
            else if (!exists && context.isUpdate) {
                errors.push(BaseObjectService.validationFailure('key', 'The setting should already exist'));
            }
            cb(err, errors);
        });
    }
}

//registrations
BaseObjectService.on(SettingService.TYPE + '.' + BaseObjectService.AFTER_DELETE, SettingService.afterDelete);
BaseObjectService.on(SettingService.TYPE + '.' + BaseObjectService.AFTER_SAVE, SettingService.afterSave);
BaseObjectService.on(SettingService.TYPE + '.' + BaseObjectService.FORMAT, SettingService.format);
BaseObjectService.on(SettingService.TYPE + '.' + BaseObjectService.MERGE, SettingService.merge);
BaseObjectService.on(SettingService.TYPE + '.' + BaseObjectService.VALIDATE, SettingService.validate);

//exports
module.exports = SettingServiceFactory;
