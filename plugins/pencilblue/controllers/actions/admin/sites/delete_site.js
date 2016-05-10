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

module.exports = function DeleteSiteActionModule(pb) {

    //pb dependencies
    var util        = pb.util;
    var SiteService = pb.SiteService;

    /**
     * Deletes a current site
     */
    function DeleteSiteAction(){}
    util.inherits(DeleteSiteAction, pb.BaseController);

    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    DeleteSiteAction.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {

            /**
             *
             * @property service
             * @type {SiteService}
             */
            self.service = new SiteService(self.getServiceContext());

            cb(err, true);
        };
        DeleteSiteAction.super_.prototype.init.apply(this, [context, init]);
    };

    DeleteSiteAction.prototype.render = function(cb) {
        var self = this;
        var siteid = self.pathVars.siteid;
        this.service.deleteSingle({where: {uid: siteid}}, function (err, site) {
            if (util.isError(err)|| !site) {
                return self.reqHandler.serve404();
            }
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.g('sites.REMOVE_SUCCESSFUL'), site)});
        });
    };

    //exports
    return DeleteSiteAction;
};
