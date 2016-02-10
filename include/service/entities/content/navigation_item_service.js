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
var util = require('../../util.js');

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
    var TYPE = 'navigation_item';

    var CONTAINER = 'container';
    var SECTION = 'section';
    var LINK = 'link';
    var ARTICLE = 'article';
    var PAGE = 'page';

    /**
     *
     * @private
     * @static
     * @readonly
     * @property VALID_TYPES
     * @type {Object}
     */
    var VALID_TYPES = {
        container: true,
        section: true,
        article: true,
        page: true,
        link: true,
    };

    /**
     * Provides interactions with topics
     * @class NavigationItemService
     * @extends BaseObjectService
     * @constructor
     * @param {Object} context
     */
    function NavigationItemService(context) {
        if (!util.isObject(context)) {
            context = {};
        }

        context.type = TYPE;
        NavigationItemService.super_.call(this, context);
    }
    util.inherits(NavigationItemService, BaseObjectService);

    /**
     *
     * @static
     * @method
     * @param {Object} context
     * @param {NavigationItemService} service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    NavigationItemService.format = function(context, cb) {
        var dto = context.data;
        dto.name = pb.BaseController.sanitize(dto.name);
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
    NavigationItemService.merge = function(context, cb) {
        context.object.name = context.data.name;
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
    NavigationItemService.validate = function(context, cb) {
        var obj = context.data;
        var errors = context.validationErrors;

        if (!pb.ValidationService.isNonEmptyStr(obj.name, true)) {
            errors.push(BaseObjectService.validationFailure('name', 'Name is required'));

            //no need to check the DB.  Short circuit it here
            return cb(null, errors);
        }

        //validate name is not taken
        var where = pb.DAO.getNotIdWhere(obj[pb.DAO.getIdField()]);
        where.name = new RegExp('^' + util.escapeRegExp(obj.name) + '$', 'i');
        context.service.dao.exists(TYPE, where, function(err, exists) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (exists) {
                errors.push(BaseObjectService.validationFailure('name', 'Name already exists'));
            }
            cb(null, errors);
        });
    };

    /**
     * @static
     * @method isValidType
     * @param {String}|{Object} type
     * @return {Boolean}
     */
    NavigationItemService.isValidType = function(type) {
        if (util.isObject(type)) {
            type = type.type;
        }

        return VALID_TYPES[type] === true;
    };

    /**
     * @static
     * @method
     * @param {Localization} ls
     * @return {array}
     */
    NavigationItemService.getTypes = function(ls) {
        if (util.isNullOrUndefined(ls)) {
            throw new Error('Parameter ls is required');
        }

        return [
            {
                value: CONTAINER,
                label: ls.g('generic.CONTAINER')
            },
            {
                value: SECTION,
                label: ls.g('generic.SECTION')
            },
            {
                value: ARTICLE,
                label: ls.g('generic.ARTICLE')
            },
            {
                value: PAGE,
                label: ls.g('generic.PAGE')
            },
            {
                value: LINK,
                label: ls.g('generic.LINK')
            },
        ];
    };

    //Event Registries
    BaseObjectService.on(TYPE + '.' + BaseObjectService.FORMAT, NavigationItemService.format);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.MERGE, NavigationItemService.merge);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.VALIDATE, NavigationItemService.validate);

    //exports
    return NavigationItemService;
};
