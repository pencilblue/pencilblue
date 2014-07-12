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
 * the cluster
 * @class ClusterApiController
 * @constructor
 */
function ClusterApiController() {};

//dependencies
var BaseController      = pb.BaseController;
var ApiActionController = pb.ApiActionController;
var UrlService          = pb.UrlService;

//inheritance
util.inherits(ClusterApiController, ApiActionController);

//constants
var ACTIONS = {
	refresh: false,
};

/**
 * Provides the hash of all actions supported by this controller
 * @method getActions
 * @return {Object} Hash of acceptable actions
 */
ClusterApiController.prototype.getActions = function() {
	return ACTIONS;
};

/**
 * Causes the service registration storage to flush all status updates.  An API
 * object is returned to the client that specifies the correct amount of time to
 * wait before the service registry is updated again by all nodes.
 * @method refresh
 * @param {Function} cb
 */
ClusterApiController.prototype.refresh = function(cb) {
    pb.ServerRegistration.flush(function(err, result) {
        var content = BaseController.apiResponse(BaseController.API_SUCCESS, 'The wait time in seconds', {wait: pb.config.registry.update_interval});
        cb({content: content});
    });
};

//exports
module.exports = ClusterApiController;
