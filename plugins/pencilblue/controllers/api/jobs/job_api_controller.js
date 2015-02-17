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
    
    //pb dependencies
    var util = pb.util;
    var BaseController      = pb.BaseController;
    var ApiActionController = pb.ApiActionController;
    var JobsService         = pb.JobsService;

    /**
     * Controller to properly route and handle remote calls to interact with
     * the JobsService
     * @class JobApiController
     * @constructor
     * @extends ApiActionController
     */
    function JobApiController() {};
    util.inherits(JobApiController, ApiActionController);

    //constants
    /**
     * The hash of actions that are available to execute for this controller. When
     * the key's value is TRUE, it indicates that a valid object ID must be part of
     * the request as a path variable "id".
     * @private
     * @static
     * @property VALID_ACTIONS
     * @type {Object}
     */
    var ACTIONS = {
        get: true,
        getLogs: true
    };

    /**
     * Provides the hash of all actions supported by this controller
     * @see ApiActionController#getActions
     * @method getActions
     */
    JobApiController.prototype.getActions = function() {
        return ACTIONS;
    };

    /**
     * Overrides the default implementation of getPostParams to parse for incoming
     * JSON instead of multipart form data. The function calls back with an object
     * reprenting the posted JSON.
     * @method getPostParams
     * @param {Function} cb A callback that provides two parameters: cb(Error, Object)
     */
    JobApiController.prototype.getPostParams = function(cb) {
        this.getJSONPostParams(cb);
    };

    /**
     * Validates any post parameters for the specified action.  The callback will
     * provide an array of validation errors. When the array is empty it is safe to
     * assume that validation succeeded. The default implementation passes an empty
     * error array.
     * @see ApiActionController#validatePostParameters
     * @method validatePostParameters
     * @param {String} action
     * @param {Object} post
     * @param {Function} cb
     */
    JobApiController.prototype.validatePostParameters = function(action, post, cb) {

        var errors = [];
        if (action === 'getLogs') {
            if (!pb.validation.isInt(post.starting, true, true)) {
                errors.push('The starting parameter must be a valid EPOCH as an integer');
            }
        }
        cb(null, errors);
    };

    /**
     * The "getLogs" action handler.  Calls the JobService function <i>getLogs</i> to
     * retrieve the array of log entries for the specified time range and job.
     * @method getLogs
     * @param {Function} cb
     */
    JobApiController.prototype.getLogs = function(cb) {

        var startingDate = new Date(this.post.starting);
        var service      = new pb.JobService();
        service.getLogs(this.pathVars.id, startingDate, function(err, logEntries) {
            if (util.isError(err)) {
                var content = BaseController.apiResponse(BaseController.API_FAILURE, err.stack);
                cb({content: content, code: 500});
                return;
            }

            //now build response
            var content = BaseController.apiResponse(BaseController.API_SUCCESS, '', logEntries);
            cb({content: content});
        });
    };

    /**
     * The "get" action handler.  Calls the JobService function <i>loadById</i> to
     * retrieve the job descriptor
     * @method get
     * @param {Function} cb
     */
    JobApiController.prototype.get = function(cb) {

        var service = new pb.JobService();
        service.loadById(this.pathVars.id, function(err, logEntries) {
            if (util.isError(err)) {
                var content = BaseController.apiResponse(BaseController.API_FAILURE, err.stack);
                cb({content: content, code: 500});
                return;
            }

            //now build response
            var content = BaseController.apiResponse(BaseController.API_SUCCESS, '', logEntries);
            cb({content: content});
        });
    };

    //exports
    return JobApiController;
};
