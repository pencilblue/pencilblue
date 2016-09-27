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

module.exports = function (pb) {

    //PB dependencies
    var util              = pb.util;
    var BaseApiController = pb.BaseApiController;
    var CustomObjectService = pb.CustomObjectService;
    var BaseObjectService = pb.BaseObjectService;

    /**
     * CustomObjectTypeApiController - Provides the ability to interact with the custom object collection
     * @class CustomObjectTypeApiController
     * @extends BaseApiController
     * @constructor
     */
    function CustomObjectTypeApiController(){}
    util.inherits(CustomObjectTypeApiController, BaseApiController);

    /**
     * Called from BaseController#init, the function creates an instance of BookService
     * based on the current site and context.  The initSync is used to initialize the
     * controller synchronously
     * @method initSync
     * @param {object} context See BaseController#init
     */
    CustomObjectTypeApiController.prototype.initSync = function(/*context*/) {

        /**
         * @property service
         * @type {CustomObjectService}
         */
        this.service = new CustomObjectService(this.site, this.onlyThisSite);
    };

    /**
     * Retrieves a single custom object type by ID
     * @method get
     * @param {function} cb (Error|object)
     */
    CustomObjectTypeApiController.prototype.get = function(cb) {
        this.service.loadTypeById(this.pathVars.id, this.handleGet(cb));
    };

    /**
     * Retrieves the collection of custom object types
     * @method getAll
     * @param {function} cb (Error|object)
     */
    CustomObjectTypeApiController.prototype.getAll = function(cb) {
        var done = this.handleGet(cb);
        this.service.findTypes(function(err, result) {
            var pagedResult = null;
            if (util.isArray(result)) {
                pagedResult = BaseObjectService.getPagedResult(result, result.length);
            }
            done(err, pagedResult);
        });
    };

    //exports
    return CustomObjectTypeApiController;
};
