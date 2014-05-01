function PluginAPI(){}

//dependencies
var BaseController = pb.BaseController;

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
	if (!pb.validation.validateNonEmptyStr(action) || VALID_ACTIONS[action] === undefined) {
		errors.push(this.ls.get('VALID_ACTION_REQUIRED'));
	}
	 
	//validate identifier
	if (VALID_ACTIONS[action] && !pb.validation.validateNonEmptyStr(identifier)) {
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
	
};

PluginAPI.prototype.uninstall = function(uid, cb) {
	
};

PluginAPI.prototype.reset_settings = function(uid, cb) {
	
};

//exports
module.exports = PluginAPI;
