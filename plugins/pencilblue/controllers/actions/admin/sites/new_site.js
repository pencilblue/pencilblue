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

module.exports = function NewSiteActionModule(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Creates a new site
     */
    function NewSiteAction(){}
    util.inherits(NewSiteAction, pb.BaseController);

    NewSiteAction.prototype.render = function(cb)
    {
        var self = this;
        var message = self.hasRequiredParams(self.body, self.getRequiredFields());
        if(message) {
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
            });
            return;
        }

        if(!pb.security.isAuthorized(self.session, {admin_level: self.body.admin})) {
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INSUFFICIENT_CREDENTIALS'))
            });
            return;
        }

        var siteService = new pb.SiteService();
        var site = pb.DocumentCreator.create('site', self.body);

        siteService.createSite(site, self.body.id, function(err, isTaken, field, result) {
            if(isTaken) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('DUPLICATE_INFO'))
                });

            }
            if(util.isError(err)) {
                cb({
                    code: 500,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                });
                return;
            }

            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('SITE_CREATED'), result)});
        });

    };

    NewSiteAction.prototype.getRequiredFields = function() {
        return ['displayName', 'hostname'];
    };

    //exports
    return NewSiteAction;
};