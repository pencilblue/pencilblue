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

    /**
     * @class DeactivateSiteApiController
     * @constructor
     * @extends BaseController
     */
    function DeactivateSiteApiController(){}
    util.inherits(DeactivateSiteApiController, pb.BaseController);

    /**
     * @method render
     * @param {Function} cb
     */
    DeactivateSiteApiController.prototype.render = function(cb) {
        var vars = this.pathVars;

        var message = this.hasRequiredParams(vars, ['id']);
        if(message) {
            return cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
            });
        }

        var siteService = new pb.SiteService();
        var jobId = siteService.deactivateSite(vars.id);
        var content = pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, '', jobId);
        cb({content: content});
    };

    //exports
    return DeactivateSiteApiController;
};