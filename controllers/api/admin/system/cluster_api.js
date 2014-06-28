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
 */
ClusterApiController.prototype.getActions = function() {
	return ACTIONS;
};

ClusterApiController.prototype.refresh = function(cb) {
    pb.ServerRegistration.flush(function(err, result) {
        var content = BaseController.apiResponse(BaseController.API_SUCCESS, '', {wait: pb.config.registry.update_interval});
        cb({content: content});
    });
};

//exports
module.exports = ClusterApiController;
