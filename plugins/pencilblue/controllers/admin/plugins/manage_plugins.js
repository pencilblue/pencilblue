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
var async = require('async');

module.exports = function(pb) {

    //pb dependencies
    var util           = pb.util;
    var BaseController = pb.BaseController;

    /**
     * Interface for managing plugins
     */
    function ManagePlugins(){}

    //inheritance
    util.inherits(ManagePlugins, BaseController);

    //statics
    var SUB_NAV_KEY = 'manage_plugins';

    ManagePlugins.prototype.render = function(cb) {
        var self = this;
        var site = pb.SiteService.getCurrentSite(self.pathVars.siteid);

        pb.SiteService.error404IfSiteDoesNotExist(self.reqHandler, site, function () {   
            //what happens if it doesnt?
            self.onSiteValidated(site, cb);
        });
    };

    ManagePlugins.prototype.onSiteValidated = function onSiteValidated(site, cb) {
        var self = this;
        var prefix = pb.SiteService.getCurrentSitePrefix(site);

        //get the data
        var tasks = {
            pluginMap: function(callback) {
                var pluginService = new pb.PluginService(site);
                pluginService.getPluginMap(callback);
            },
            siteName: function(callback) {
                var siteService = new pb.SiteService();
                siteService.getSiteNameByUid(site, function(siteName) {
                    callback(null, siteName);
                });
            }
        };

        async.parallel(tasks, function(err, results) {
            //setup angular
            var angularObjects = pb.ClientJs.getAngularObjects({
                navigation: pb.AdminNavigation.get(self.session, ['plugins', 'manage'], self.ls),
                pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls),
                installedPlugins: results.pluginMap.active,
                inactivePlugins: results.pluginMap.inactive,
                availablePlugins: results.pluginMap.available,
                sitePrefix: prefix,
                siteUid: site,
                siteName: results.siteName
            });
            //load the template
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('/admin/plugins/manage_plugins', function(err, result) {
                cb({content: result});
            });
        });
    };

    ManagePlugins.getSubNavItems = function(key, ls, data) {
        return [
            {
                name: 'manage_plugins',
                title: ls.get('MANAGE_PLUGINS'),
                icon: 'refresh',
                href: '/admin/plugins'
            }
        ];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManagePlugins.getSubNavItems);

    //exports
    return ManagePlugins;
};
