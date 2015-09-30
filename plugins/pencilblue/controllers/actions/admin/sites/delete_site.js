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

module.exports = function DeleteSiteActionModule(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Deletes a current site
     */
    function DeleteSiteAction(){}
    util.inherits(DeleteSiteAction, pb.BaseController);

    DeleteSiteAction.prototype.render = function(cb) {
        var self = this;
        var siteid = self.pathVars.siteid;
        var siteService = new pb.SiteService();
        siteService.deleteSingle({where: {uid: siteid}}, function (err, site) {
            if (util.isError(err)) {
                return cb(err);
            }
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('REMOVE_SUCCESSFUL'), site)});
        });
    };

    //exports
    return DeleteSiteAction;
};