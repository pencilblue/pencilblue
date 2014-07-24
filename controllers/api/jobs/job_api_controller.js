/*
    Copyright (C) 2014  PencilBlue, LLC

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

/**
 * Controller to properly route and handle remote calls to interact with
 * the JobsService
 * @class JobApiController
 * @constructor
 * @extends ApiActionController
 */
function JobApiController() {};

//dependencies
var BaseController      = pb.BaseController;
var ApiActionController = pb.ApiActionController;
var JobsService         = pb.JobsService;

//inheritance
util.inherits(JobApiController, ApiActionController);

//constants
var ACTIONS = {
	get: true,
	getLogs: true
};

/**
 * Provides the hash of all actions supported by this controller
 */
JobApiController.prototype.getActions = function() {
	return ACTIONS;
};

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
 * see whether or not the provided URL path could trigger a controller to be
 * executed.
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
 * The "get" action handler.  Calls the JobService function <i>exists</i> to
 * see whether or not the provided URL path could trigger a controller to be
 * executed.
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

/**
 * The "exists_for" action handler.  Calls the UrlService function
 * <i>existsForType</i> to see whether or not the provided URL path the URL key
 * of that particular object type.
 */
JobApiController.prototype.exists_for = function(cb) {

	var params = {
        type: this.query.type,
        id: this.query.id,
        url: this.query.url
	};
	var service = new UrlService();
	service.existsForType(params, function(err, exists) {
		if (util.isError(err)) {
			var content = BaseController.apiResponse(BaseController.API_FAILURE, err.message);
			cb({content: content, code: 500});
			return;
		}

		//now build response
		var content = BaseController.apiResponse(BaseController.API_SUCCESS, '', exists);
		cb({content: content});
	});
};

//exports
module.exports = JobApiController;
