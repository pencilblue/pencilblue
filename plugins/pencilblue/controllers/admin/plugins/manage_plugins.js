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

//dependencies
var async = require('async');

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;
    var BaseAdminController = pb.BaseAdminController;
    var PluginService = pb.PluginService;

    /**
     * Interface for managing plugins
     * @class ManagePlugins
     * @extends BaseAdminController
     */
    function ManagePlugins(){}
    util.inherits(ManagePlugins, BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'manage_plugins';

    /**
     * See BaseController.initSync
     * @method initSync
     */
    ManagePlugins.prototype.initSync = function(/*context*/) {

        this.pluginService = new PluginService(this.getServiceContext());

        this.globalPluginService = new PluginService({});
    };

    ManagePlugins.prototype.render = function (cb) {
        var self = this;

        var tasks = {
            sitePluginMap: [util.wrapTask(this.pluginService, this.pluginService.getPluginMap)],
            globalPluginMap: [util.wrapTask(this.globalPluginService, this.globalPluginService.getPluginMap)],
            availablePluginsMinusGlobal: ['sitePluginMap', 'globalPluginMap', function(callback, results) {

                //create lookup
                var lookup = {};
                results.globalPluginMap.active.forEach(function(plugin) {
                    lookup[plugin.uid] = true;
                });

                //filter globally installed plugins out of inactive
                var availablePluginsMinusGlobal = results.sitePluginMap.available.filter(function(val) {
                    return !lookup[val.uid];
                });
                callback(null, availablePluginsMinusGlobal);
            }],
            angularObjects: ['availablePluginsMinusGlobal', function(callback, results) {

                //setup angular
                var angularObjects = pb.ClientJs.getAngularObjects({
                    navigation: pb.AdminNavigation.get(self.session, ['plugins', 'manage'], self.ls, self.site),
                    pills: self.getAdminPills(SUB_NAV_KEY, self.ls, null),
                    installedPlugins: results.sitePluginMap.active,
                    inactivePlugins: results.sitePluginMap.inactive,
                    availablePlugins: results.availablePluginsMinusGlobal,
                    globalActivePlugins: results.globalPluginMap.active,
                    siteUid: self.site
                });
                //load the template
                self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
                callback();
            }],
            content: ['angularObjects', util.wrapTask(this.ts, this.ts.load, ['/admin/plugins/manage_plugins'])]
        };
        async.auto(tasks, 2, function(err, results) {
            if (util.isError(err)) {
                return cb(err);
            }
            cb({content: results.content});
        });
    };

    ManagePlugins.getSubNavItems = function(key, ls, data) {
        return [
            {
                name: 'manage_plugins',
                title: ls.g('plugins.MANAGE_PLUGINS'),
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
