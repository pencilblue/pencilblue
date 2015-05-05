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

module.exports = function(pb) {

    //PB dependencies
    var util = pb.util;

    /**
     * 
     * @class BaseApiController
     * @constructor
     */
    function BaseApiController(){}
    util.inherits(BaseApiController, pb.BaseController);

    /**
     * Retrieves a resource by ID where :id is a path parameter
     * @method get
     * @param {Function} cb
     */
    BaseApiController.prototype.get = function(cb) {
        var id = this.pathVars.id;
        this.service.get(id, this.handleGet(cb));
    };

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
    BaseApiController.prototype.getAll = function(cb) {
        
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
        var select = null;
        var rawSelect = q.$select;
        if (pb.ValidationService.isNonEmptyStr(rawSelect, true)) {
            var select = {};
            var pieces = rawSelect.split(',');
            pieces.forEach(function(rawStatement) {
                
                var statement = rawStatement.split('=');
                if (statement.length == 2 && pb.ValidationService.isNonEmptyStr(statement[0], true) && (statement[1] === '1' || statement[1] === '0')) {
                    
                    select[statement[0]] = parseInt(statement[1]);
                }
                else {
                    var failures = [ pb.BaseObjectService.validationFailure('$select', 'An invalid select statement was provided: ' + statement[0] + '=' + statement[1]) ];
                    return cb(pb.BaseObjectService.validationError(failures));
                }
            });
        }
        
        //process the order
        var order = null;
        var rawOrder = q.$order;
        if (pb.ValidationService.isNonEmptyStr(rawSelect, true)) {
            var order = [];
            var pieces = rawSelect.split(',');
            pieces.forEach(function(rawStatement) {
                
                var statement = rawStatement.split('=');
                if (statement.length == 2 && pb.ValidationService.isNonEmptyStr(statement[0], true) && pb.ValidationService.isInt(statement[1], true)) {
                    
                    order.push([statement[0], parseInt(statement[1]) > 0 ? pb.DAO.ASC : pb.DAO.DESC ]);
                }
                else {
                    var failures = [ pb.BaseObjectService.validationFailure('$order', 'An invalid order statement was provided: ' + statement[0] + '=' + statement[1]) ];
                    return cb(pb.BaseObjectService.validationError(failures));
                }
            });
        }
        
        //process where
        var where = null;
        //TODO implement a where clause parser
        
        var options = {
            select: select,
            limit: limit,
            offset: offset
        };
        this.service.getAllWithCount(options, this.handleGet(cb));
    };
    
    /**
     * Creates a resource
     * @method post
     * @param {Function} cb
     */
    BaseApiController.prototype.post = function(cb) {
        var dto = this.body || {};
        delete dto[pb.DAO.getIdField()];
        this.service.save(dto, this.handleSave(cb, true));
    };
    
    /**
     * Updates a resource with the ID specified in the body of the request.  
     * @method put
     * @param {Function} cb
     */
    BaseApiController.prototype.put = function(cb) {
        var dto = this.body || {};
        this.service.save(dto, this.handleSave(cb, false));
    };

    /**
     * Deletes the resource with the specified ID from the URI path ":id".  
     * @method delete
     * @param {Function} cb
     */
    BaseApiController.prototype.delete = function(cb) {
        var id = this.pathVars.id;
        this.service.deleteById(id, this.handleDelete(cb));
    };
    
    /**
     * Creates a handler that can be used to prepare a response for GET 
     * operations.  When the result is NULL a 404 is generated.  Otherwise a 200 
     * response along with the object serialized as JSON is the generated 
     * response
     * @method handleDelete
     * @param {Function} cb
     * @return {Function} That can prepare a response and execute the callback
     */
    BaseApiController.prototype.handleGet = function(cb) {
        var self = this;
        return function(err, obj) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (util.isNullOrUndefined(obj)) {
                return self.notFound(cb);    
            }
            
            cb({
                content: JSON.stringify(obj)
            });
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
    BaseApiController.prototype.handleSave = function(cb, isCreate) {
        var self = this;
        return function(err, obj) {
            if (util.isError(err)) {
                return cb(err);
            }
            
            cb({
                content: JSON.stringify(obj),
                code: isCreate ? 201: 200
            });
        };
    };
    
    /**
     * Creates a handler that can be used to prepare a response for DELETE 
     * operations. When the item cannot be found a 404 is issued.  When the 
     * object is successfully delete a 204 status is provided
     * @method handleDelete
     * @param {Function} cb
     * @return {Function} That can prepare a response and execute the callback
     */
    BaseApiController.prototype.handleDelete = function(cb) {
        var self = this;
        return function(err, obj) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (util.isNullOrUndefined(obj)) {
                return self.reqHandler.serve404();    
            }
            
            cb({
                content: '',
                code: 204
            });
        };
    };
    
    /**
     * Calls back to the request handler with an error representing a 404 not 
     * found
     * @method notFound
     */
    BaseApiController.prototype.notFound = function(cb) {
        var error = new Error('NOT FOUND');
        error.code = 404;
        cb(error);
    };

    //exports
    return BaseApiController;
};