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
* Interface for the site's libraries settings
*/

function Libraries(){}

//dependencies
var SiteSettings = require('../site_settings');

//inheritance
util.inherits(Libraries, pb.BaseController);

//statics
var SUB_NAV_KEY = 'libraries_settings';

Libraries.prototype.render = function(cb) {
	var self = this;

	var tabs =
	[
		{
			active: 'active',
			href: '#css',
			icon: 'css3',
			title: 'CSS'
		},
		{
			href: '#javascript',
			icon: 'eject fa-rotate-90',
			title: 'JavaScript'
		}
	];

	pb.libraries.getSettings(function(err, librarySettings) {
		var angularData = pb.js.getAngularController(
			{
				navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings'], self.ls),
				pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'libraries'),
				tabs: tabs,
				librarySettings: librarySettings
			}
		);

		self.setPageName(self.ls.get('LIBRARIES'));
		self.ts.registerLocal('angular_script', angularData);
		self.ts.registerLocal('cdn_defaults', pb.js.getJSTag('var cdnDefaults = ' + JSON.stringify(pb.libraries.getCDNDefaults()) + ';'));
		self.ts.registerLocal('bower_defaults', pb.js.getJSTag('var bowerDefaults = ' + JSON.stringify(pb.libraries.getBowerDefaults()) + ';'));
		self.ts.load('admin/site_settings/libraries', function(err, data) {
			var result = '' + data;
			self.checkForFormRefill(result, function(newResult) {
				result = newResult;
				cb({content: result});
			});
		});
	});
};


Libraries.getSubNavItems = function(key, ls, data) {
	var pills = SiteSettings.getPillNavOptions(ls);
	pills.splice(0, 1);
	pills.unshift(
	{
		name: 'configuration',
		title: ls.get('LIBRARIES'),
		icon: 'chevron-left',
		href: '/admin/site_settings/configuration'
	});
	return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, Libraries.getSubNavItems);

//exports
module.exports = Libraries;
