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
'use strict';

module.exports = function SaveHomePageSettingsModule(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     *  Saves settings for the display of home page content in the Portfolio theme
     * @class SaveHomePageSettings
     * @author Blake Callens <blake@pencilblue.org>
     * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
     */
    function SaveHomePageSettings() {}
    util.inherits(SaveHomePageSettings, pb.BaseAdminController);

    SaveHomePageSettings.prototype.render = function(cb) {
        var self = this;

        this.getJSONPostParams(function(err, post) {
            delete post[pb.DAO.getIdField()];

            var opts = {
                where: {settings_type: 'home_page'}
            };
            self.siteQueryService.q('portfolio_theme_settings', opts, function(err, homePageSettings) {
                if (util.isError(err)) {
                    return self.reqHandler.serveError(err);
                }
                if(homePageSettings.length > 0) {
                    homePageSettings = homePageSettings[0];
                    pb.DocumentCreator.update(post, homePageSettings);
                }
                else {
                    homePageSettings = pb.DocumentCreator.create('portfolio_theme_settings', post);
                    homePageSettings.settings_type = 'home_page';
                }

                self.siteQueryService.save(homePageSettings, function(err, result) {
                    if(util.isError(err))  {
                        cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'), result)
                        });
                        return;
                    }

                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.g('HOME_PAGE_SETTINGS') + ' ' + self.ls.g('admin.SAVED'))});
                });
            });
        });
    };

    SaveHomePageSettings.prototype.getSanitizationRules = function() {
        return {
            page_layout: pb.BaseController.getContentSanitizationRules()
        };
    };

    SaveHomePageSettings.getRoutes = function(cb) {
        var routes = [
            {
                method: 'post',
                path: '/actions/admin/plugins/settings/portfolio/home_page',
                auth_required: true,
                inactive_site_access: true,
                access_level: pb.SecurityService.ACCESS_EDITOR,
                content_type: 'text/html'
            }
        ];
        cb(null, routes);
    };

    //exports
    return SaveHomePageSettings;
};
