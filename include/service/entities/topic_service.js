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
var BaseObjectService = require('../base_object_service');
var DAO = require('../../dao/dao');
var RegExpUtils = require('../../utils/reg_exp_utils');
var ValidationService = require('../../validation/validation_service');

module.exports = function(pb) {

    /**
     * Provides interactions with topics
     * @class TopicService
     * @extends BaseObjectService
     * @constructor
     * @param {Object} context
     */
    class TopicService extends BaseObjectService {
        constructor(context) {

            context.type = TopicService.TYPE;
            super(context);
        }

        /**
         * @readonly
         * @type {String}
         */
        static get TYPE() {
            return 'topic';
        }

        /**
         *
         * @static
         * @method onFormat
         * @param {Object} context
         * @param {TopicService} context.service An instance of the service that triggered
         * the event that called this handler
         * @param {Function} cb A callback that takes a single parameter: an error if occurred
         */
        static onFormat(context, cb) {
            var dto = context.data;
            dto.name = BaseObjectService.sanitize(dto.name);
            cb(null);
        }

        /**
         *
         * @static
         * @method onMerge
         * @param {Object} context
         * @param {TopicService} context.service An instance of the service that triggered
         * the event that called this handler
         * @param {Function} cb A callback that takes a single parameter: an error if occurred
         */
        static onMerge(context, cb) {
            context.object.name = context.data.name;
            cb(null);
        }

        /**
         *
         * @static
         * @method onValidate
         * @param {Object} context
         * @param {Object} context.data The DTO that was provided for persistence
         * @param {TopicService} context.service An instance of the service that triggered
         * the event that called this handler
         * @param {Function} cb A callback that takes a single parameter: an error if occurred
         */
        static onValidate(context, cb) {
            var obj = context.data;
            var errors = context.validationErrors;

            if (!ValidationService.isNonEmptyStr(obj.name, true)) {
                errors.push(BaseObjectService.validationFailure('name', 'Name is required'));

                //no need to check the DB.  Short circuit it here
                return cb(null, errors);
            }

            //validate name is not taken
            var where = DAO.getNotIdWhere(obj[DAO.getIdField()]);
            where.name = RegExpUtils.getCaseInsensitiveExact(obj.name);
            context.service.dao.exists(BaseObjectService.TYPE, where, function (err, exists) {
                if (_.isError(err)) {
                    return cb(err);
                }
                else if (exists) {
                    errors.push(BaseObjectService.validationFailure('name', 'Name already exists'));
                }
                cb(null, errors);
            });
        }
    }

    //Event Registries
    BaseObjectService.on(TopicService.TYPE + '.' + BaseObjectService.FORMAT, TopicService.onFormat);
    BaseObjectService.on(TopicService.TYPE + '.' + BaseObjectService.MERGE, TopicService.onMerge);
    BaseObjectService.on(TopicService.TYPE + '.' + BaseObjectService.VALIDATE, TopicService.onValidate);

    //exports
    return TopicService;
};
