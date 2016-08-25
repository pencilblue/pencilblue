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
    var TYPE = 'topic';

    /**
     * Provides interactions with topics
     * @class TopicService
     * @extends BaseObjectService
     * @constructor
     * @param {Object} context
     */
    function TopicService(context) {
        if (!util.isObject(context)) {
            context = {};
        }

        context.type = TYPE;
        TopicService.super_.call(this, context);
    }
    util.inherits(TopicService, BaseObjectService);

    /**
     *
     * @static
     * @method format
     * @param {Object} context
     * @param {TopicService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    TopicService.format = function(context, cb) {
        var dto = context.data;
        dto.name = BaseObjectService.sanitize(dto.name);
        cb(null);
    };

    /**
     *
     * @static
     * @method merge
     * @param {Object} context
     * @param {TopicService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    TopicService.merge = function(context, cb) {
        context.object.name = context.data.name;
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
    TopicService.validate = function(context, cb) {
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

    //Event Registries
    BaseObjectService.on(TYPE + '.' + BaseObjectService.FORMAT, TopicService.format);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.MERGE, TopicService.merge);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.VALIDATE, TopicService.validate);

    //exports
    return TopicService;
};
