/*
    Copyright (C) 2015  PencilBlue, LLC

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
var BaseController = require('../base_controller');
var BaseObjectService = require('../../include/service/base_object_service');
var DAO = require('../../include/dao/dao');
var ErrorUtils = require('../../include/error/error_utils');
var HttpStatusCodes = require('http-status-codes');
var util = require('util');
var ValidationService = require('../../include/validation/validation_service');

/**
 *
 * @class BaseApiController
 * @constructor
 */
class BaseApiController extends BaseController {
    constructor() {

        /**
         * The service used for CRUD operations
         * @type {BaseObjectService}
         */
        this.service = null;

        super();
    }

    /**
     * Indicates if a field should be part of the projection
     * @static
     * @readonly
     * @property FIELD_ON
     * @type {String}
     */
    static get FIELD_ON() {
        return '1';
    }

    /**
     * Indicates if a field should be part of the projection
     * @static
     * @readonly
     * @property FIELD_OFF
     * @type {String}
     */
    static get FIELD_OFF() {
        return '0';
    }

    /**
     * The delimiter used when multiple values are provided for a single query
     * parameter
     * @static
     * @readonly
     * @property MULTI_DELIMITER
     * @type {String}
     */
    static get MULTI_DELIMITER() {
        return ',';
    }

    /**
     * Retrieves a resource by ID where :id is a path parameter
     * @method get
     * @param {Function} cb
     */
    get(cb) {
        this.service.get(this.pathVars.id, this.processQuery(), this.handleGet(cb));
    }

    /**
     * Retrieves one or more resources from a collection.  The endpoint
     * supports the following query string parameters:
     * <ul>
     * <li>$select - A comma separated list of key/value pairs where a value
     * of 1 indicates the field will be returned and 0 indicates the
     * absensence.  $select=_id=1,name=1,description=0</li>
     * <li>$order - A comma separated list of key/value pairs where a value of
     * 1 indicates ascending a value of 0 or less indicates descending.
     * $order=name=1,created_date=0</li>
     * <li>$limit - An integer representing the maximum number of results to
     * return</li>
     * <li>$offset - An integer representing the number of items to skip before
     * returning results</li>
     * <li>$where - Currently not supported</li>
     * </ul>
     * @method getAll
     * @param {Function} cb
     */
    getAll(cb) {
        var options = this.processQuery();
        this.service.getAllWithCount(options, this.handleGet(cb));
    }

    /**
     * Prcoess the query string and builds the options for passing to the
     * object service
     * @method processQuery
     * @return {Object} The options representing the query
     */
    processQuery() {
        var q = this.query;

        //get limit & offset
        var limit = parseInt(q.$limit);
        if (isNaN(limit)) {
            limit = null;
        }
        var offset = parseInt(q.$offset);
        if (isNaN(offset)) {
            offset = null;
        }

        //process select
        var selectResult = this.processSelect(q.$select);

        //process the order
        var orderResult = this.processOrder(q.$order);

        //process where
        var whereResult = this.processWhere(q);

        //when failures occur combine them into a one big error and throw it to
        //stop execution
        var failures = selectResult.failures.concat(orderResult.failures).concat(whereResult.failures);
        if (failures.length > 0) {
            throw BaseObjectService.validationError(failures);
        }

        return {
            select: selectResult.select,
            where: whereResult.where,
            order: orderResult.order,
            limit: limit,
            offset: offset
        };
    }

    /**
     * Processes the query string to develop the where clause for the query request
     * @method processWhere
     * @param {Object} q The hash of all query parameters from the request
     * @return {Object}
     */
    processWhere(q) {
        var where = null;
        var failures = [];

        //TODO provide a default implementation
        return {
            where: where,
            failures: failures
        };
    }

    /**
     * Processes the value of a $order query string variable
     * @method processOrder
     * @param {String} rawOrder
     * @return {Object} Contains the order statement and an array of failures
     */
    processOrder(rawOrder) {
        var order = null;
        var failures = [];

        if (ValidationService.isNonEmptyStr(rawOrder, true)) {

            order = [];
            var orderPieces = rawOrder.split(',');
            orderPieces.forEach(function (rawStatement) {

                var statement = rawStatement.split('=');
                if (statement.length === 2 &&
                    ValidationService.isNonEmptyStr(statement[0], true) &&
                    ValidationService.isInt(statement[1], true)) {

                    order.push([statement[0], parseInt(statement[1]) > 0 ? DAO.ASC : DAO.DESC]);
                }
                else {

                    var msg = util.format('An invalid order statement was provided: %s=%s', statement[0], statement[1]);
                    failures.push(BaseObjectService.validationFailure('$order', msg));
                }
            });
        }

        return {
            order: order,
            failures: failures
        };
    }

    /**
     * Processes the value of a $select query string variable
     * @method processSelect
     * @param {String} rawSelect
     * @return {Object} Contains the select statement and an array of failures
     */
    processSelect(rawSelect) {
        var select = null;
        var failures = [];

        if (ValidationService.isNonEmptyStr(rawSelect, true)) {

            select = {};
            var selectPieces = rawSelect.split(',');
            selectPieces.forEach(function (rawStatement) {

                var statement = rawStatement.split('=');
                if (statement.length === 2 &&
                    ValidationService.isNonEmptyStr(statement[0], true) &&
                    (statement[1] === BaseApiController.FIELD_ON || statement[1] === BaseApiController.FIELD_OFF)) {

                    select[statement[0]] = parseInt(statement[1]);
                }
                else {

                    var msg = util.format('An invalid select statement was provided: %s=%s', statement[0], statement[1]);
                    failures.push(BaseObjectService.validationFailure('$select', msg));
                }
            });
        }

        return {
            select: select,
            failures: failures
        };
    }

    /**
     * Creates a resource
     * @method post
     * @param {Function} cb
     */
    post(cb) {
        var dto = this.getPostDto();
        this.service.add(dto, this.handleSave(cb, true));
    }

    /**
     * Retrieves the request DTO.  The function ensures that the id field is
     * removed.
     * @method getPostDto
     * @return {Object}
     */
    getPostDto() {
        var dto = this.body || {};
        delete dto[DAO.getIdField()];
        return dto;
    }

    /**
     * Updates a resource with the ID specified in the body of the request.
     * @method put
     * @param {Function} cb
     */
    put(cb) {
        var dto = this.body || {};
        this.service.update(dto, this.handleGet(cb, false));
    }

    /**
     * Deletes the resource with the specified ID from the URI path ":id".
     * @method delete
     * @param {Function} cb
     */
    delete(cb) {
        var id = this.pathVars.id;
        this.service.deleteById(id, this.handleDelete(cb));
    }

    /**
     * Creates a handler that can be used to prepare a response for GET
     * operations.  When the result is NULL a 404 is generated.  Otherwise a 200
     * response along with the object serialized as JSON is the generated
     * response
     * @method handleDelete
     * @param {Function} cb
     * @return {Function} That can prepare a response and execute the callback
     */
    handleGet(cb) {
        var self = this;
        return function (err, obj) {
            if (_.isError(err)) {
                return cb(err);
            }
            else if (_.isNil(obj)) {
                return self.notFound(cb);
            }

            cb({
                content: obj
            });
        };
    }

    /**
     * Creates a handler that can be used to prepare a response for POST or PUT
     * operations. Upon successful create a 201 status code is returned. Upon
     * successful update a 200 status code is returned.  Validation errors are
     * expected to be handled by the global error handler and should return 400
     * @method handleSave
     * @param {Function} cb
     * @return {Function} That can prepare a response and execute the callback
     */
    handleSave(cb, isCreate) {
        return function (err, obj) {
            if (_.isError(err)) {
                return cb(err);
            }

            cb({
                content: obj,
                code: isCreate ? HttpStatusCodes.CREATED : HttpStatusCodes.OK
            });
        };
    }

    /**
     * Creates a handler that can be used to prepare a response for DELETE
     * operations. When the item cannot be found a 404 is issued.  When the
     * object is successfully delete a 204 status is provided
     * @method handleDelete
     * @param {Function} cb
     * @return {Function} That can prepare a response and execute the callback
     */
    handleDelete(cb) {
        var self = this;
        return function (err, obj) {
            if (_.isError(err)) {
                return cb(err);
            }
            else if (_.isNil(obj)) {
                return self.reqHandler.serve404();
            }

            cb({
                content: '',
                code: HttpStatusCodes.NO_CONTENT
            });
        };
    }

    /**
     * Calls back to the request handler with an error representing a 404 not
     * found
     * @method notFound
     */
    notFound(cb) {
        cb(ErrorUtils.notFound());
    }
}

//exports
module.exports = BaseApiController;
