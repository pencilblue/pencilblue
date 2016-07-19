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
    var util = pb.util;
    var UrlService     = pb.UrlService;

    /**
     * Interface for managing themes
     */
    function ManageThemes(){}
    util.inherits(ManageThemes, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'themes_index';

    ManageThemes.prototype.render = function (cb) {
        var self = this;

        //get plugs with themes
        var pluginService = new pb.PluginService({site: self.site});
        pluginService.getPluginsWithThemesBySite(function (err, themes) {
            if (util.isError(err)) {
                throw err;
            }

            //get active theme
            self.settings.get('active_theme', function(err, activeTheme) {
                if (util.isError(err)) {
                    throw err;
                }

                //add default theme
                var options = util.copyArray(themes);
                options.push({
                    uid: pb.config.plugins.default,
                    name: 'PencilBlue'

                });

                self.settings.get('site_logo', function(err, logo) {
                    if(util.isError(err)) {
                        pb.log.error("ManageThemes: Failed to retrieve site logo: "+err.stack);
                    }

                    var siteLogo = '';
                    if (logo) {
                        if (UrlService.isFullyQualifiedUrl(logo)) {
                            siteLogo = logo;
                        }
                        else {
                            siteLogo = UrlService.urlJoin('', logo);
                        }
                    }

                    //setup angular
                    var angularObjects = pb.ClientJs.getAngularObjects({
                        navigation: pb.AdminNavigation.get(self.session, ['plugins', 'themes'], self.ls, self.site),
                        pills: self.getAdminPills(SUB_NAV_KEY, self.ls, null),
                        tabs: self.getTabs(),
                        themes: themes,
                        options: options,
                        siteLogo: siteLogo,
                        activeTheme: activeTheme
                    });

                    self.ts.registerLocal('image_title', '');
                    self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
                    self.ts.load('/admin/themes/manage_themes', function(err, data) {
                        var result = '' + data;
                        cb({content: result});
                    });
                });
            });
        });
    };

    ManageThemes.prototype.getTabs = function() {
        return [{
            active: 'active',
            href: '#themes',
            icon: 'magic',
            title: this.ls.g('admin.THEMES')
        },
        {
            href: '#site_logo',
            icon: 'picture-o',
            title: this.ls.g('admin.SITE_LOGO')
        }];
    };

    ManageThemes.getSubNavItems = function(key, ls, data) {
        return [
            {
                name: 'manage_themes',
                title: ls.g('themes.MANAGE_THEMES'),
                icon: 'refresh',
                href: '/admin/themes'
            }
       ];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageThemes.getSubNavItems);

    //exports
    return ManageThemes;
};
