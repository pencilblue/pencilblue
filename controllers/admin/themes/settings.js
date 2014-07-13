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
* Interface for changing a theme's settings
*/

function ThemeSettingsController() {}

//dependencies
var PluginSettingsController = require('../plugins/settings.js');

//inheritance
util.inherits(ThemeSettingsController, PluginSettingsController);

ThemeSettingsController.prototype.getSettings = function(uid, cb) {
	pb.plugins.getThemeSettings(uid, cb);
};

ThemeSettingsController.prototype.setSettings = function(settings, uid, cb) {
	pb.plugins.setThemeSettings(settings, uid, cb);
};

PluginSettingsController.prototype.getBackUrl = function() {
	return '/admin/themes/';
};

//exports
module.exports = ThemeSettingsController;
