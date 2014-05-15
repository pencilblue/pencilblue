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
