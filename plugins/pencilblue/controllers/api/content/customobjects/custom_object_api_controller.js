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
var async = require('async');

module.exports = function (pb) {

    //PB dependencies
    var util              = pb.util;
    var BaseApiController = pb.BaseApiController;
    var CustomObjectService = pb.CustomObjectService;
    var BaseObjectService = pb.BaseObjectService;

    /**
     * CustomObjectApiController - Provides functionality to interact with the custom object collection
     * @class CustomObjectApiController
     * @extends BaseApiController
     * @constructor
     */
    function CustomObjectApiController(){}
    util.inherits(CustomObjectApiController, BaseApiController);

    /**
     * Called from BaseController#init, the function creates an instance of CustomObjectService
     * based on the current site and context.  The initSync is used to initialize the
     * controller synchronously
     * @method initSync
     * @param {object} context See BaseController#init
     */
    CustomObjectApiController.prototype.initSync = function(/*context*/) {

        /**
         * @property service
         * @type {CustomObjectService}
         */
        this.service = new CustomObjectService(this.site, this.onlyThisSite);
    };

    /**
     * Retrieves a single custom object by ID
     * @method get
     * @param {function} cb (Error|object)
     */
    CustomObjectApiController.prototype.get = function(cb) {
        var where = pb.DAO.getIdWhere(this.pathVars.id);
        this.service.loadBy(this.pathVars.customObjectTypeId, where, this.handleGet(cb));
    };

    /**
     * Retrieves the collection of custom objects
     * @method getAll
     * @param {function} cb (Error|object)
     */
    CustomObjectApiController.prototype.getAll = function(cb) {
        var done = this.handleGet(cb);
        var options = this.processQuery();

        var tasks = {

            data: util.wrapTask(this.service, this.service.findByType, [this.pathVars.customObjectTypeId, options]),

            total: util.wrapTask(this.service, this.service.countByType, [this.pathVars.customObjectTypeId, options.where])
        };
        async.parallel(tasks, function(err, pageDetails) {
            if (!!pageDetails) {
                pageDetails = BaseObjectService.getPagedResult(pageDetails.data, pageDetails.total, BaseObjectService.getLimit(options.limit), options.offset || 0);
            }
            done(err, pageDetails);
        });
    };

    //exports
    return CustomObjectApiController;
};
