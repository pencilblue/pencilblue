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

module.exports = function WPImportModule(pb) {

    /**
     * WordPress Import: import a WordPress blog's content into PencilBlue
     *
     * @class WPImport
     * @constructor
     */
    function WPImport(){}

    /**
     * Called when the application is being installed for the first time.
     * @static
     * @method
     * @param {function} cb A callback that must be called upon completion.  cb(err, result).
     * The result is ignored
     */
    WPImport.onInstall = function(cb) {
        cb(null, true);
    };

    /**
     * Called when the application is uninstalling this plugin.  The plugin should
     * make every effort to clean up any plugin-specific DB items or any in function
     * overrides it makes.
     * @static
     * @method
     * @param {function} cb A callback that must be called upon completion.  cb(err, result).
     * The result is ignored
     */
    WPImport.onUninstall = function(cb) {
        var result = pb.AdminSubnavService.unregisterFor('plugin_settings', WPImport.onPluginSettingsSubNav);
        cb(null, result);
    };

    /**
     * Called when the application is starting up. The function is also called at
     * the end of a successful install. It is guaranteed that all core PB services
     * will be available including access to the core DB.
     * @static
     * @method
     * @param {function} cb A callback that must be called upon completion.  cb(err, result).
     * The result is ignored
     */
    WPImport.onStartup = function(cb) {
        var result = pb.AdminSubnavService.registerFor('plugin_settings', WPImport.onPluginSettingsSubNav);
        cb(null, result);
    };

    /**
     *
     * @static
     * @method onPluginSettingsSubNav
     * @param {String} navKey
     * @param {Localization}
     * @param {Object} The plugin object
     * @return {Array}
     */
    WPImport.onPluginSettingsSubNav = function(navKey, localization, data) {
        if(data.plugin.uid === 'wp_import') {
            return [
                {
                    name: 'import_xml',
                    title: 'Import WordPress XML',
                    icon: 'upload',
                    href: '/admin/plugins/wp_import/settings/import'
                }
            ];
        }
        return [];
    };

    /**
     * Called when the application is gracefully shutting down.  No guarantees are
     * provided for how much time will be provided the plugin to shut down.
     *
     * @param cb A callback that must be called upon completion.  cb(err, result).
     * The result is ignored
     */
    WPImport.onShutdown = function(cb) {
        cb(null, true);
    };

    //exports
    return WPImport;
};
