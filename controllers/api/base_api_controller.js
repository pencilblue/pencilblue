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

module.exports = function BaseApiControllerModule(pb) {

  // PB dependencies
  const util = pb.util;
  const BaseObjectService = pb.BaseObjectService;

  /**
   *
   * @class BaseApiController
   * @constructor
   */
  class BaseApiController extends pb.BaseController {

    constructor() {
      super();
      /**
       * Processes the query string to develop the where clause for the query request
       * @method processWhere
       * @param {Object} q The hash of all query parameters from the request
       * @return {Object}
       */
      this.processWhere = function processWhere() {
        // TODO provide a default implementation
        return {
          where: null,
          failures: [],
        };
      };
      /**
       * Processes the value of a $order query string variable
       * @method processOrder
       * @param {String} rawOrder
       * @return {Object} Contains the order statement and an array of failures
       */
      this.processOrder = (rawOrder) => {
        let order = null;
        const failures = [];

        if (pb.ValidationService.isNonEmptyStr(rawOrder, true)) {
          order = [];
          const orderPieces = rawOrder.split(',');
          orderPieces.forEach((rawStatement) => {
            const statement = rawStatement.split('=');
            if (statement.length === 2 &&
              pb.ValidationService.isNonEmptyStr(statement[0], true) &&
              pb.ValidationService.isInt(statement[1], true)) {
              order.push([statement[0], parseInt(statement[1], 10) > 0 ? pb.DAO.ASC : pb.DAO.DESC]);
            } else {
              const msg = util.format('An invalid order statement was provided: %s=%s', statement[0], statement[1]);
              failures.push(pb.BaseObjectService.validationFailure('$order', msg));
            }
          });
        }

        return {
          order,
          failures,
        };
      };
      /**
       * Processes the value of a $select query string variable
       * @method processSelect
       * @param {String} rawSelect
       * @return {Object} Contains the select statement and an array of failures
       */
      this.processSelect = (rawSelect) => {
        let select = null;
        const failures = [];

        if (pb.ValidationService.isNonEmptyStr(rawSelect, true)) {
          select = {};
          const selectPieces = rawSelect.split(',');
          selectPieces.forEach((rawStatement) => {
            const statement = rawStatement.split('=');
            if (statement.length === 2 &&
              pb.ValidationService.isNonEmptyStr(statement[0], true) &&
              (statement[1] === BaseApiController.FIELD_ON ||
                statement[1] === BaseApiController.FIELD_OFF)) {
              select[statement[0]] = parseInt(statement[1], 10);
            } else {
              const msg = util.format('An invalid select statement was provided: %s=%s', statement[0], statement[1]);
              failures.push(pb.BaseObjectService.validationFailure('$select', msg));
            }
          });
        }

        return {
          select,
          failures,
        };
      };
      /**
       * Creates a handler that can be used to prepare a response for POST or PUT
       * operations. Upon successful create a 201 status code is returned. Upon
       * successful update a 200 status code is returned.  Validation errors are
       * expected to be handled by the global error handler and should return 400
       * @method handleSave
       * @param {Function} cb
       * @return {Function} That can prepare a response and execute the callback
       */
      this.handleSave = (cb, isCreate) =>
        (err, obj) => {
          if (util.isError(err)) {
            return cb(err);
          }
          return cb({
            content: obj,
            code: isCreate ? 201 : 200,
          });
        };


      /**
       * Calls back to the request handler with an error representing a 404 not
       * found
       * @method notFound
       */
      this.notFound = (cb) => {
        cb(BaseObjectService.notFound('NOT FOUND'));
      };
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
      const options = this.processQuery();
      this.service.getAllWithCount(options, this.handleGet(cb));
    }

    /**
     * Prcoess the query string and builds the options for passing to the
     * object service
     * @method processQuery
     * @return {Object} The options representing the query
     */
    processQuery() {
      const q = this.query;

      // get limit & offset
      let limit = parseInt(q.$limit, 10);
      if (isNaN(limit)) {
        limit = null;
      }
      let offset = parseInt(q.$offset, 10);
      if (isNaN(offset)) {
        offset = null;
      }

      // process select
      const selectResult = this.processSelect(q.$select);

      // process the order
      const orderResult = this.processOrder(q.$order);

      // process where
      const whereResult = this.processWhere(q);

      // when failures occur combine them into a one big error and throw it to
      // stop execution
      const failures = selectResult.failures
        .concat(orderResult.failures)
        .concat(whereResult.failures);
      if (failures.length > 0) {
        throw pb.BaseObjectService.validationError(failures);
      }

      return {
        select: selectResult.select,
        where: whereResult.where,
        order: orderResult.order,
        limit,
        offset,
      };
    }

    /**
     * Creates a resource
     * @method post
     * @param {Function} cb
     */
    post(cb) {
      const dto = this.getPostDto();
      this.service.add(dto, this.handleSave(cb, true));
    }

    /**
     * Retrieves the request DTO.  The function ensures that the id field is
     * removed.
     * @method getPostDto
     * @return {Object}
     */
    getPostDto() {
      const dto = this.body || {};
      delete dto[pb.DAO.getIdField()];
      return dto;
    }

    /**
     * Updates a resource with the ID specified in the body of the request.
     * @method put
     * @param {Function} cb
     */
    put(cb) {
      const dto = this.body || {};
      this.service.update(dto, this.handleGet(cb, false));
    }

    /**
     * Deletes the resource with the specified ID from the URI path ":id".
     * @method delete
     * @param {Function} cb
     */
    delete(cb) {
      const id = this.pathVars.id;
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
      return (err, obj) => {
        if (util.isError(err)) {
          return cb(err);
        } else if (util.isNullOrUndefined(obj)) {
          return this.notFound(cb);
        }
        return cb({
          content: obj,
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
      return (err, obj) => {
        if (util.isError(err)) {
          return cb(err);
        } else if (util.isNullOrUndefined(obj)) {
          return this.reqHandler.serve404();
        }
        return cb({
          content: '',
          code: 204,
        });
      };
    }

  }

  /**
   * Indicates if a field should be part of the projection
   * @static
   * @readonly
   * @property FIELD_ON
   * @type {String}
   */
  BaseApiController.FIELD_ON = '1';

  /**
   * Indicates if a field should be part of the projection
   * @static
   * @readonly
   * @property FIELD_OFF
   * @type {String}
   */
  BaseApiController.FIELD_OFF = '0';

  /**
   * The delimiter used when multiple values are provided for a single query
   * parameter
   * @static
   * @readonly
   * @property MULTI_DELIMITER
   * @type {String}
   */
  BaseApiController.MULTI_DELIMITER = ',';

  // exports
  return BaseApiController;
};
