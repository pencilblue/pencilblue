function PluginAPI(){}

//dependencies
var BaseController = pb.BaseController;
var PluginService  = pb.PluginService;

//inheritance
util.inherits(PluginAPI, BaseController);

//constants
var VALID_ACTIONS = {
	install: true,
	uninstall: true,
	reset_settings: true
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
	    		details = plugin;
	    		callback(err, true);
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

//exports
module.exports = PluginAPI;
