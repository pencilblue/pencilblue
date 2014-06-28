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
 * Controller to properly route and handle remote calls to interact with
 * the PluginService
 */

function PluginAPI(){}//TODO refactor to match api_action_controller

//dependencies
var BaseController = pb.BaseController;
var PluginService  = pb.PluginService;
var RequestHandler = pb.RequestHandler;

//inheritance
util.inherits(PluginAPI, BaseController);

//constants
var VALID_ACTIONS = {
	install: true,
	uninstall: true,
	reset_settings: true,
	initialize: true,
	set_theme: true,
};

PluginAPI.prototype.render = function(cb) {
	var action     = this.pathVars.action;
	var identifier = this.pathVars.id;

	//validate action
	var errors = [];
	if (!pb.validation.validateNonEmptyStr(action, true) || VALID_ACTIONS[action] === undefined) {
		errors.push(this.ls.get('VALID_ACTION_REQUIRED'));
	}

	//validate identifier
	if (VALID_ACTIONS[action] && !pb.validation.validateNonEmptyStr(identifier, true)) {
		errors.push(this.ls.get('VALID_IDENTIFIER_REQUIRED'));
	}

	//check for errors
	if (errors.length > 0) {
		var content = BaseController.apiResponse(BaseController.API_FAILURE, '', errors);
		cb({content: content, code: 400});
		return;
	}
	//route to handler
	this[action](identifier, cb);
};

PluginAPI.prototype.install = function(uid, cb) {
	var self = this;

	pb.plugins.installPlugin(uid, function(err, result) {
		if (util.isError(err)) {
			var data = [err.message];
			if (util.isArray(err.validationErrors)) {
				for(var i = 0; i < err.validationErrors.length; i++) {
					data.push(err.validationErrors[i].message);
				}
			}
			var content = BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.get('INSTALL_FAILED'), uid), data);
			cb({content: content, code: 400});
			return;
		}

		var content = BaseController.apiResponse(BaseController.API_SUCCESS, util.format(self.ls.get('INSTALL_SUCCESS'), uid));
		cb({content: content});
	});
};

PluginAPI.prototype.uninstall = function(uid, cb) {
	var self = this;

	pb.plugins.uninstallPlugin(uid, function(err, result) {
		if (util.isError(err)) {
			var content = BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.get('UNINSTALL_FAILED'), uid), [err.message]);
			cb({content: content, code: 400});
			return;
		}

		var content = BaseController.apiResponse(BaseController.API_SUCCESS, util.format(self.ls.get('UNINSTALL_SUCCESS'), uid));
		cb({content: content});
	});
};

PluginAPI.prototype.reset_settings = function(uid, cb) {
	var self = this;

	var details = null;
	var tasks = [

        //load plugin
	    function(callback) {
	    	pb.plugins.getPlugin(uid, function(err, plugin) {
	    		if (!plugin) {
	    			callback(new Error(util.format(self.ls.get('PLUGIN_NOT_FOUND'), uid)), false);
	    			return;
	    		}

	    		var detailsFile = PluginService.getDetailsPath(plugin.dirName);
	    		PluginService.loadDetailsFile(detailsFile, function(err, loadedDetails) {
	    			if (util.isError(err)) {
		    			callback(err, false);
		    			return;
		    		}

	    			details = loadedDetails;
	    			callback(null, true);
	    		});
	    	});
	    },

	    //pass plugin to reset settings
	    function(callback) {
	    	pb.plugins.resetSettings(details, callback);
	    },

	    //pass plugin to reset theme settings
	    function(callback) {
	    	if (!details.theme || !details.theme.settings) {
	    		callback(null, true);
	    		return;
	    	}
	    	pb.plugins.resetThemeSettings(details, callback);
	    }
	];
	async.series(tasks, function(err, results) {
		if (util.isError(err)) {
			var data = [err.message];
			if (util.isArray(err.validationErrors)) {
				for(var i = 0; i < err.validationErrors.length; i++) {
					data.push(err.validationErrors[i].message);
				}
			}
			var content = BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.get('RESET_SETTINGS_FAILED'), uid), data);
			cb({content: content, code: 400});
			return;
		}

		var content = BaseController.apiResponse(BaseController.API_SUCCESS, util.format(self.ls.get('RESET_SETTINGS_SUCCESS'), uid));
		cb({content: content});
	});
};

PluginAPI.prototype.initialize = function(uid, cb) {
	var self = this;

	pb.plugins.getPlugin(uid, function(err, plugin) {
		if (util.isError(err)) {
			var content = BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.get('INITIALIZATION_FAILED'), uid), [err.message]);
			cb({content: content, code: 500});
			return;
		}

		pb.plugins.initPlugin(plugin, function(err, results) {
			if (util.isError(err)) {
				var content = BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.get('INITIALIZATION_FAILED'), uid), [err.message]);
				cb({content: content, code: 400});
				return;
			}

			var content = BaseController.apiResponse(BaseController.API_SUCCESS, util.format(self.ls.get('INITIALIZATION_SUCCESS'), uid));
			cb({content: content});
		});
	});
};

PluginAPI.prototype.set_theme = function(uid, cb) {
	var self = this;

	//retrieve plugin
	pb.plugins.getPlugin(uid, function(err, plugin) {
		if (uid !== RequestHandler.DEFAULT_THEME && util.isError(err)) {
			var content = BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.get('SET_THEME_FAILED'), uid), [err.message]);
			cb({content: content, code: 500});
			return;
		}

		//plugin wasn't found & has theme
		if (uid !== RequestHandler.DEFAULT_THEME && (!plugin || !pb.utils.isObject(plugin.theme))) {
			self.reqHandler.serve404();
			return;
		}

		var theme = plugin ? plugin.uid : uid;
		pb.settings.set('active_theme', theme, function(err, result) {
			if (util.isError(err)) {
				var content = BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.get('SET_THEME_FAILED'), uid), [err.message]);
				cb({content: content, code: 500});
				return;
			}

			var content = BaseController.apiResponse(BaseController.API_SUCCESS, util.format(self.ls.get('SET_THEME_SUCCESS'), uid));
			cb({content: content});
		});
	});
};

//exports
module.exports = PluginAPI;
