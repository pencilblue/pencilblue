/**
 * WordPress Import: import a WordPress blog's content into PencilBlue
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC
 */
function WPImport(){}

/**
 * Called when the application is being installed for the first time.
 *
 * @param cb A callback that must be called upon completion.  cb(err, result).
 * The result is ignored
 */
WPImport.onInstall = function(cb) {
	cb(null, true);
};

/**
 * Called when the application is uninstalling this plugin.  The plugin should
 * make every effort to clean up any plugin-specific DB items or any in function
 * overrides it makes.
 *
 * @param cb A callback that must be called upon completion.  cb(err, result).
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
 *
 * @param cb A callback that must be called upon completion.  cb(err, result).
 * The result is ignored
 */
WPImport.onStartup = function(cb) {
	var result = pb.AdminSubnavService.registerFor('plugin_settings', WPImport.onPluginSettingsSubNav);
    cb(null, result);
};

/**
 * @static
 * @method onPluginSettingsSubNav
 * @param {String} navKey
 * @param {Localization}
 * @param {Object} The plugin object
 * @return {Array}
 */
WPImport.onPluginSettingsSubNav = function(navKey, localization, plugin) {
    if(plugin.uid === 'wp_import') {
        return [
            {
                name: 'import_xml',
                title: 'Import WordPress XML',
                icon: 'upload',
                href: '/admin/plugins/settings/wp_import/import'
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
module.exports = WPImport;
