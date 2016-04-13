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

//dependencies
var async = require('async');
var util = require('../../../util.js');

module.exports = function(pb) {

    //pb dependencies
    var BaseObjectService = pb.BaseObjectService;

    /**
     * @private
     * @static
     * @readonly
     * @property TYPE
     * @type {String}
     */
    var TYPE = 'navigation_map';

    /**
     * Provides interactions with Navigation Maps.
     * @example
     * {
     *   lookup: {
     *     "dj19h5hj922k": [],
     *     "2iowkds2uqjw": ["dj19h5hj922k"]
     *   },
     *   structure: [
     *     {
     *       id: "dj19h5hj922k",
     *       children: [
     *         {
     *           id: "2iowkds2uqjw",
     *           children: []
     *         }
     *       ]
     *     }
     *   ]
     * }
     * @class NavigationMapService
     * @extends BaseObjectService
     * @constructor
     * @param {Object} context
     */
    function NavigationMapService(context) {

        context.type = TYPE;

        /**
         * @property navigationItemService
         * @type {NavigtationItemService}
         */
        this.navigationItemService = new pb.NavigationItemService(util.merge(context, {}));

        NavigationMapService.super_.call(this, context);
    }
    util.inherits(NavigationMapService, BaseObjectService);

    /**
     *
     * @method merge
     * @param {Object} context
     * @param {Object} context.data The DTO sent by the incoming request
     * @param {Object} context.object The object to be persisted
     * @param {NavigationMapService} service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    NavigationMapService.prototype.merge = function(context, cb) {
        var dto = context.data;
        var obj = context.object;

        // create a quick lookup variable where we use the ID for the navigation
        // item as the key and an array of IDs that represent its ancestry
        obj.lookup = {};
        obj.name = dto.name;

        //now we iterate, recursively, over the structure to merge into the object
        var q = [];
        obj.structure = [];
        dto.structure.forEach(function(itemDto) {
            q.push({
                dto: itemDto,
                entity: {},
                parentArray: obj.structure,
                path: []
            });
        });

        //process the queue
        var self = this;
        var subContext = util.merge(context, {});
        async.whilst(
            function () { return q.length > 0; },
            function (callback) {
                var item = q.shift();

                subContext.data = item.dto;
                subContext.object = item.entity;
                self.mergeNavigationItem(subContext, function(err) {

                    //queue up any children
                    if (util.isArray(item.dto.children)) {
                        item.dto.children.forEach(function(child) {

                            //add to path
                            var p = util.clone(item.path);
                            p.push(item.dto.id);

                            //queue up the item
                            q.push({
                                dto: child,
                                entity: {},
                                parentArray: item.entity.children,
                                path: p
                            });
                        });
                    }
                    callback(err);
                });
            },
            cb
        );
    };

    /**
     *
     * @static
     * @method mergeNavigationItem
     * @param {Object} context
     * @param {NavigationMapService} service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    NavigationMapService.prototype.mergeNavigationItem = function(context, cb) {
        var dto = context.data;
        var obj = context.object;

        obj.id = dto.id;
        obj.name = dto.name;
        obj.children = [];
        cb(null);
    };

    /**
     *
     * @method format
     * @param {Object} context
     * @param {NavigationMapService} service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    NavigationMapService.prototype.format = function(context, cb) {
        cb(null);
    };

    /**
     *
     * @method validate
     * @param {Object} context
     * @param {Object} context.data The entity that was provided for persistence
     * @param {NavigationMapService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    NavigationMapService.prototype.validate = function(context, cb) {

        //validate name
        var tasks = [
            util.wrapTask(this, this.validateName, [context]),
            util.wrapTask(this, this.validateStructure, [context])
        ];
        async.series(tasks, cb);
    };

    NavigationMapService.prototype.validateName = function(context, cb) {
        var entity = context.data;
        var errors = context.validationErrors;

        //check for a non-empty name
        if (pb.ValidationService.isNonEmptyStr(entity.name, true)) {
            errors.push(BaseObjectService.validationFailure('name', 'The name property must be non-empty'));
            return cb();
        }

        //ensure that there is no name collision
        this.dao.unique(this.type, { name: entity.name }, function(err, isUnique) {
            if (util.isError(err)) {
                return cb(err);
            }
            if (!isUnique) {
                errors.push(BaseObjectService.validationFailure('name', 'The name property must be unique'));
            }
            return cb();
        });
    };

    NavigationMapService.prototype.validateStructure = function(context, cb) {
        var entity = context.data;
        var errors = context.validationErrors;

        if (!util.isArray(entity.structure)) {
            errors.push(BaseObjectService.validationFailure('structure', 'The structure property must be an array'));
            return cb();
        }
        if (entity.structure.length === 0) {
            return cb();
        }

        //load nav item cache
        var self = this;
        var opts = {
            where: pb.DAO.getIdInWhere(NavigationMapService.extractItemIds(entity.structure))
        };
        this.navigationItemService.getAll(opts, function(err, navigationItems) {
            if (util.isError(err)) {
                return cb(err);
            }

            //transform to hash and set the cache on the context
            context.navigationItems = util.objArrayToHash(navigationItems, pb.DAO.getIdField());

            //validate each of the items in the structure
            var tasks = util.getTasks(entity.structure, function(structure, i) {
                return function(callback) {
                    self.validateItem(structure[i], context, callback);
                };
            });
            async.series(tasks, cb);
        });
    };

    NavigationMapService.prototype.validateItem = function(item, context, cb) {
        var errors = context.validationErrors;

        //main validation
        if (!context.navigationItems[item.id]) {
            errors.push(BaseObjectService.validationFailure('id', 'The id property must be an array'));
            return cb();
        }

        //validate children
        if (!util.isArray(item.children)) {
            errors.push(BaseObjectService.validationFailure('children', 'The children property must be an array'));
            return cb();
        }
        if (item.children.length === 0) {
            return cb();
        }

        //when children exist recursively call to validate
        var self = this;
        var tasks = util.getTasks(item.children, function(i, children) {
            return function(callback) {

                var ctx = util.merge(context, {});
                ctx.parent = item;
                self.validateItem(children[i], ctx, callback);
            };
        });
        async.series(tasks, cb);
    };

    NavigationMapService.extractItemIds = function(structure) {
        return NavigationMapService.extractItemValues(structure, function(item) { return item.id; });
    };

    NavigationMapService.extractItemValues = function(structure, valueExtractor) {
        //populate the queue
        var q = [];
        util.arrayPushAll(structure, q);

        var values = {};
        while (q.length > 0) {

            var item = q.shift();
            if (util.isObject(item) && item.id) {//TODO fix the id reference
                values[valueExtractor(item)] = true;

                //Queue up children
                if (util.isArray(item.children)) {
                    util.arrayPushAll(item.children, q);
                }
            }
        }
        return Object.keys(values);
    };

    /**
     *
     * @static
     * @method format
     * @param {Object} context
     * @param {NavigationMapService} service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    NavigationMapService.format = function(context, cb) {
        context.service.format(context, cb);
    };

    /**
     *
     * @static
     * @method
     * @param {Object} context
     * @param {NavigationMapService} service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    NavigationMapService.merge = function(context, cb) {
        context.service.merge(context, cb);
        cb(null);
    };

    /**
     *
     * @static
     * @method validate
     * @param {Object} context
     * @param {Object} context.data The DTO that was provided for persistence
     * @param {NavigationMapService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    NavigationMapService.validate = function(context, cb) {
        context.service.validate(context, cb);
    };

    //Event Registries
    BaseObjectService.on(TYPE + '.' + BaseObjectService.FORMAT, NavigationMapService.format);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.MERGE, NavigationMapService.merge);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.VALIDATE, NavigationMapService.validate);

    //exports
    return NavigationMapService;
};
