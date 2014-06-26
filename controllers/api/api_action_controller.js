/**
 * The abstract controller interface used to map simple actions to handlers and
 * provide a flow for validation and error handling.
 *
 * @class UrlService
 * @constructor
 * @extends BaseController
 * @module Controllers
 *
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC. All Rights Reserved
 */
function ApiActionController(){}

//dependencies
var BaseController = pb.BaseController;
var PluginService  = pb.PluginService;
var RequestHandler = pb.RequestHandler;

//inheritance
util.inherits(ApiActionController, BaseController);

/**
 * Flag to indicate if the form should automatically sanitize the incoming
 * values.  In this case sanitize means it will attempt to strip away any
 * HTML tags to prevent HTML injection and XSS.
 * @protected
 * @property
 * @type {Boolean}
 */
ApiActionController.prototype.autoSanitize = true;

/**
 * The entry point called by the RequestHandler.  Executes the calls to the
 * validation framework then, if passes, executes the action handler.
 *
 * @method render
 * @see BaseController#render
 * @param cb A call back that provides one parameter. An object
 * containing the result of the action: cb({code: HTTP_STATUS, content: JSON})
 */
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
 * Provides the hash of all actions supported by this controller
 * @method getActions
 * @see ApiActionController#getActions
 * @returns {object}
 */
ApiActionController.prototype.getActions = function() {
	return {};
};

/**
 * Validates the query, path, and post parameters in parallel and calls back
 * with any validation errors.
 *
 * @method validateParameters
 * @param {string} action The action specified by the URL path
 * @param {function} cb A call back that provides two parameters: cb(err, [{string])
 */
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

                        if (self.getAutoSanitize()) {
                            self.sanitizeObject(post);
                        }
            			self.validatePostParameters(action, post, callback);
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

ApiActionController.prototype.getAutoSanitize = function() {
    return this.autoSanitize;
};

ApiActionController.prototype.setAutoSanitize = function(val) {
    this.autoSanitize = val ? true : false;
};

/**
 * Validates any path parameters for the specified action.  The callback will
 * provide an array of validation errors. When the array is empty it is safe to
 * assume that validation succeeded. The default implementation examines the
 * value for the action in the value returned by ApiActionController#getActions.
 * If the value evaluates to true then the implementation will validate that an
 * "id" path parameter was passed.
 *
 * @method validatePathParameters
 * @param {string} action
 * @param {function} cb A call back that provides two parameters: cb(err, [{string])
 */
ApiActionController.prototype.validatePathParameters = function(action, cb) {
	//validate identifier
	var errors  = [];
	var actions = this.getActions();
	if (actions[action] && !pb.validation.validateNonEmptyStr(this.pathVars.id, true)) {
		errors.push(this.ls.get('VALID_IDENTIFIER_REQUIRED'));
	}
	cb(null, errors);
};

/**
 * Validates any query parameters for the specified action.  The callback will
 * provide an array of validation errors. When the array is empty it is safe to
 * assume that validation succeeded. The default implementation passes an empty
 * error array.
 * @method validateQueryParameters
 * @param {string} action
 * @param {function} cb A call back that provides two parameters: cb(err, [{string])
 */
ApiActionController.prototype.validateQueryParameters = function(action, cb) {
	cb(null, []);
};

/**
 * Validates any post parameters for the specified action.  The callback will
 * provide an array of validation errors. When the array is empty it is safe to
 * assume that validation succeeded. The default implementation passes an empty
 * error array.
 * @method validatePostParameters
 * @param {string} action
 * @param {function} cb A call back that provides two parameters: cb(err, [{string])
 */
ApiActionController.prototype.validatePostParameters = function(action, post, cb) {
	cb(null, []);
};

//exports
module.exports.ApiActionController = ApiActionController;
