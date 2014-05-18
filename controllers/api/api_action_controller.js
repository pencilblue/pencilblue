function ApiActionController(){}

//dependencies
var BaseController = pb.BaseController;
var PluginService  = pb.PluginService;
var RequestHandler = pb.RequestHandler;

//inheritance
util.inherits(ApiActionController, BaseController);

ApiActionController.prototype.render = function(cb) {

	//validate action
	var self   = this;
	var action = this.pathVars.action;
	this.validateParameters(action, function(err, errors) {
		var isError = util.isError(err);
		//check for errors
		if (isError || errors.length > 0) {
			var content = BaseController.apiResponse(BaseController.API_FAILURE, '', errors);
			cb({content: content, code: isError ? 500 : 400});
			return;
		}
		
		//route to handler
		self[action](cb);
	});
};

/**
 * @method getActions
 * @returns {
 *     "ACTION_NAME": true/false
 * }
 */
ApiActionController.prototype.getActions = function() {
	return {};
};

ApiActionController.prototype.validateParameters = function(action, cb) {

	var actions = this.getActions();
	if (!pb.validation.validateNonEmptyStr(action, true) || actions[action] === undefined) {
		cb(null, [this.ls.get('VALID_ACTION_REQUIRED')]);
		return;
	}
	else {
		var self = this;
		var tasks = [
            function(callback) {
            	self.validatePathParameters(action, callback);
            },
            function(callback) {
            	self.validateQueryParameters(action, callback);
            },
            function(callback) {
            	if (self.req.method.toUpperCase() === 'POST') {
            		self.getPostParams(function(err, post) {
            			if (util.isError(err)) {
            				callback(err, []);
            				return;
            			}
            			self.validatePostParameters(action, post, cb);
            		});
            	}
            	else {
            		callback(null, []);
            	}
            },
        ];
		async.parallel(tasks, function(err, results) {
			
			var errors = [];
			if (util.isArray(results)) {
				for (var i = 0; i < results.length; i++) {
					if (util.isArray(results[i])) {
						pb.utils.arrayPushAll(results[i], errors);
					}
				}
			}
			cb(err, errors);
		});
	}
};

ApiActionController.prototype.validatePathParameters = function(action, cb) {
	//validate identifier
	var errors  = [];
	var actions = this.getActions();
	if (actions[action] && !pb.validation.validateNonEmptyStr(this.pathVars.id, true)) {
		errors.push(this.ls.get('VALID_IDENTIFIER_REQUIRED'));
	}
	cb(null, errors);
};

ApiActionController.prototype.validateQueryParameters = function(action, cb) {
	cb(null, []);
};

ApiActionController.prototype.validatePostParameters = function(action, cb) {
	cb(null, []);
};

//exports
module.exports.ApiActionController = ApiActionController;
