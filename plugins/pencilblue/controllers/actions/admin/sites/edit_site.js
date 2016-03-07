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

module.exports = function EditSiteActionModule(pb) {
    //pb dependencies
    var util = pb.util;

    /**
     * Edits a current site
     */
    function EditSiteAction(){}
    util.inherits(EditSiteAction, pb.BaseController);

    EditSiteAction.prototype.render = function(cb) {
        var self = this;
        var siteid = this.pathVars.siteid;
        var message = self.hasRequiredParams(self.body, self.getRequiredFields());
        if(message) {
            return cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
            });
        }

        if(!pb.security.isAuthorized(self.session, {admin_level: self.body.admin})) {
            return cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.g('generic.INSUFFICIENT_CREDENTIALS'))
            });
        }

        var siteService = new pb.SiteService();
        var dao = new pb.DAO();
        dao.loadByValue('uid', siteid, 'site', function(err, data) {
            siteService.isDisplayNameOrHostnameTaken(self.body.displayName, self.body.hostname, data._id, function (err, isTaken/*, field*/) {
                if(isTaken) {
                    return cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.g('sites.DUPLICATE_INFO'))
                    });
                }

                data.displayName = self.body.displayName;
                data.hostname = self.body.hostname;
                self.body.supportedLocales = {};
                for (var i=0; i< self.body.selectedLocales.length; i++) {
                    var selectedLocale = self.body.selectedLocales[i];
                    self.body.supportedLocales[selectedLocale] = true;
                }
                data.supportedLocales = self.body.supportedLocales;
                data.defaultLocale = self.body.defaultLocale;

                var jobId = siteService.editSite(data, function(err, result) {
                    var content = pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.g('sites.UPDATING_SITE'), jobId);
                    cb({content: content});
                });
            });
        });
    };

    EditSiteAction.prototype.getRequiredFields = function() {
        return['displayName', 'hostname', 'defaultLocale', 'selectedLocales'];
    };

    //exports
    return EditSiteAction;
};
