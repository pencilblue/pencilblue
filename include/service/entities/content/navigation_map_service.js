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
        NavigationMapService.super_.call(this, context);
    }
    util.inherits(NavigationMapService, BaseObjectService);

    NavigationMapService.prototype.merge = function(context, cb) {
        var dto = context.data;
        var obj = context.object;

        // create a quick lookup variable where we use the ID for the navigation
        // item as the key and an array of IDs that represent its ancestry
        obj.lookup = {};

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
     * @static
     * @method
     * @param {Object} context
     * @param {NavigationItemService} service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    NavigationMapService.format = function(context, cb) {
        //var dto = context.data;
        cb(null);
    };

    /**
     *
     * @static
     * @method
     * @param {Object} context
     * @param {NavigationItemService} service An instance of the service that triggered
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
     * @param {NavigationItemService} context.service An instance of the service that triggered
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
