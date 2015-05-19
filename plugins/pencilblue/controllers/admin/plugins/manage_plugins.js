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
    var util           = pb.util;

    /**
     * Interface for managing plugins
     */
    function ManagePlugins(){}

    //inheritance
    util.inherits(ManagePlugins, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'manage_plugins';

    ManagePlugins.prototype.render = function (cb) {
        var self = this;

        var pluginService = new pb.PluginService();
        pluginService.getPluginMap(function (err, map) {
            if (util.isError(err)) {
                self.reqHandler.serveError(err);
                return;
            }

            //setup angular
            var prefix = self.sitePrefix;
            var angularObjects = pb.ClientJs.getAngularObjects({
                navigation: pb.AdminNavigation.get(self.session, ['plugins', 'manage'], self.ls),
                pills: self.getAdminPills(SUB_NAV_KEY, self.ls, null, {sitePrefix: prefix}),
                installedPlugins: map.active,
                inactivePlugins: map.inactive,
                availablePlugins: map.available,
                sitePrefix: prefix,
                siteUid: self.pathSiteUId,
                siteName: self.siteName
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
                href: '/admin' + data.sitePrefix + '/plugins'
            }
        ];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManagePlugins.getSubNavItems);

    //exports
    return ManagePlugins;
};
