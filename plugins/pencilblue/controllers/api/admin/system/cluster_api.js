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

module.exports = function(pb) {

    //pb dependencies
    var util               = pb.util;
    var BaseController     = pb.BaseController;
    var BaseApiController  = pb.BaseApiController;
    var UrlService         = pb.UrlService;
    var ServerRegistration = pb.ServerRegistration;

    /**
     * Controller to properly route and handle remote calls to interact with
     * the cluster
     * @class ClusterApiController
     * @constructor
     */
    function ClusterApiController() {};
    util.inherits(ClusterApiController, BaseApiController);

    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    ClusterApiController.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {

            /**
             *
             * @property service
             * @type {ServerRegistration}
             */
            self.service = ServerRegistration.getInstance();

            cb(err, true);
        };
        ClusterApiController.super_.prototype.init.apply(this, [context, init]);
    };

    /**
     * Causes the service registration storage to flush all status updates.  An API
     * object is returned to the client that specifies the correct amount of time to
     * wait before the service registry is updated again by all nodes.
     * @method refresh
     * @param {Function} cb
     */
    ClusterApiController.prototype.refresh = function(cb) {
        this.service.flush(function(err, result) {
            var data = {
                update_interval: pb.config.registry.update_interval,
                result: result,

                //for backward compatibility
                wait: pb.config.registry.update_interval
            };
            var content = BaseController.apiResponse(BaseController.API_SUCCESS, '', data);
            cb({content: content});
        });
    };

    /**
     * Retrieves the status for the entire cluster
     * @method getAll
     * @param {Function} cb
     */
    ClusterApiController.prototype.getAll = function(cb) {
        this.service.getClusterStatus(this.handleGet(cb));
    };

    //exports
    return ClusterApiController;
};
