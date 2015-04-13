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
    var util = pb.util;
    var PluginSettings = require('../plugins/plugin_settings.js')(pb);
    
    /**
     * Interface for changing a theme's settings
     */
    function ThemeSettings() {
        
        /**
         *
         * @property pluginService
         * @type {PluginService}
         */
        this.pluginService = new pb.PluginService();
    }
    util.inherits(ThemeSettings, PluginSettings);

    ThemeSettings.prototype.getSettings = function(uid, cb) {
        this.pluginService.getThemeSettings(uid, cb);
    };

    ThemeSettings.prototype.setSettings = function(settings, uid, cb) {
        this.pluginService.setThemeSettings(settings, uid, cb);
    };

    PluginSettings.prototype.getBackUrl = function() {
        return '/admin/themes/';
    };

    //exports
    return ThemeSettings;
};
