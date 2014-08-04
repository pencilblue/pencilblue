/*
	Copyright (C) 2014  PencilBlue, LLC

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

/**
* Interface for managing plugins
*/

function PluginsIndex(){}

//dependencies
var BaseController = pb.BaseController;

//inheritance
util.inherits(PluginsIndex, BaseController);

//statics
var SUB_NAV_KEY = 'plugins_index';

PluginsIndex.prototype.render = function(cb) {
	var self = this;

	//get the data
	pb.plugins.getPluginMap(function(err, map) {
		if (util.isError(err)) {
			self.reqHandler.serveError(err);
			return;
		}

		//setup angular
		var angularData = pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['plugins', 'manage'], self.ls),
				pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls),
                installedPlugins: map.active,
                inactivePlugins: map.inactive,
                availablePlugins: map.available
            },
            []
        );

		//load the template
		self.ts.registerLocal('angular_script', angularData);
		self.ts.load('/admin/plugins/index', function(err, data) {
			var result = '' + data;
			cb({content: result});
		});
	});
};

PluginsIndex.getSubNavItems = function(key, ls, data) {
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
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, PluginsIndex.getSubNavItems);

//exports
module.exports = PluginsIndex;
