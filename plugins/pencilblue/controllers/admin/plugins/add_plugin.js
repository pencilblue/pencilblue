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

    // PB dependencies
    var util = pb.util;
    var PluginService = pb.PluginService;

    /**
     * Interface for managing plugins
     * @class ManagePlugins
     * @extends BaseAdminController
     */
    function AddPlugin(){}
    util.inherits(AddPlugin, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'add_plugin';

    /**
     * See BaseController.initSync
     * @method initSync
     */
    AddPlugin.prototype.initSync = function(/*context*/) {

    };

    AddPlugin.prototype.render = function (cb) {
        var angularObjects = pb.ClientJs.getAngularObjects({
            pills: this.getAdminPills(SUB_NAV_KEY, this.ls, null),
            tabs: this.getTabs(),
            navigation: pb.AdminNavigation.get(this.session, ['plugins', 'manage'], this.ls, this.site)
        });

        //render page
        this.setPageName('Add a plugin');
        this.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
        this.ts.load('/admin/plugins/add_plugin', function(err, result) {
            cb({content: result});
        });
    };

    AddPlugin.prototype.getTabs = function() {
        return [{
            active: 'active',
            href: '#plugin_upload',
            icon: 'upload',
            title: 'Upload'
        },
        {
            href: '#repo_clone',
            icon: 'git',
            title: 'Clone repository'
        }];
    };

    AddPlugin.getSubNavItems = function(key, ls, data) {
        return [
            {
                name: 'manage_plugins',
                title: ls.g('plugins.MANAGE_PLUGINS'),
                icon: 'chevron-left',
                href: '/admin/plugins'
            },
            {
                name: 'add_plugin',
                title: '',
                icon: 'plus',
                href: '/admin/plugins/add'
            }
        ];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, AddPlugin.getSubNavItems);

    //exports
    return AddPlugin;
};
