/**
 * The controller to properly route and handle remote calls to interact with the 
 * UrlService.
 * 
 * @class UrlApiController
 * @constructor
 * @extends ApiActionController
 * @module Controllers
 * @submodule API
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC. All Rights Reserved
 */
function UrlApiController() {};

//dependencies
var BaseController      = pb.BaseController;
var ApiActionController = pb.ApiActionController;
var UrlService          = pb.UrlService;

//inheritance
util.inherits(UrlApiController, ApiActionController);

//constants
/**
 * @private
 * @property
 * @type {object}
 */
var ACTIONS = {
	exists: false,
	exists_for: false
};

/**
 * Provides the hash of all actions supported by this controller
 * @method getActions
 * @see ApiActionController#getActions
 * @returns {object
 */
UrlApiController.prototype.getActions = function() {
	return ACTIONS;
};

/**
 * Validates any path parameters for the specified action.  The callback will 
 * provide an array of validation errors. When the array is empty it is safe to 
 * assume that validation succeeded.
 * @method validatePathParameters
 * @see ApiActionController#validatePathParameters
 * @param {string} action
 * @param {function} cb A call back that provides two parameters: cb(err, [{string])
 */
UrlApiController.prototype.validatePathParameters = function(action, cb) {
	cb(null, []);
};

/**
 * Validates any query parameters for the specified action.  The callback will 
 * provide an array of validation errors. When the array is empty it is safe to 
 * assume that validation succeeded.
 * @method validateQueryParameters
 * @see ApiActionController#validateQueryParameters
 * @param {string} action
 * @param {function} cb A call back that provides two parameters: cb(err, [{string])
 */
UrlApiController.prototype.validateQueryParameters = function(action, cb) {
	
	var errors = [];
	if (action === 'exists_for') {
		if (!pb.validation.validateNonEmptyStr(this.query.id, false)) {
			errors.push("The id parameter must be a valid string");
		}
		
		if (!pb.validation.validateNonEmptyStr(this.query.type, true)) {
			errors.push("The type parameter is required");
		}
	}
	
	if (!pb.validation.validateNonEmptyStr(this.query.url, true)) {
		errors.push("The url parameter is required");
	}
	cb(null, errors);
};

/**
 * The "exists" action handler.  Calls the UrlService function <i>exists</i> to 
 * see whether or not the provided URL path could trigger a controller to be 
 * executed.
 * @method exists
 * @param {function} cb A call back that provides one parameter. An object 
 * containing the result of the action: cb({code: HTTP_STATUS, content: JSON})
 */
UrlApiController.prototype.exists = function(cb) {
	var themes  = UrlService.exists(this.query.url);
	
	//now build response
	var content = BaseController.apiResponse(BaseController.API_SUCCESS, '', themes);
	cb({content: content});
};

/**
 * The "exists_for" action handler.  Calls the UrlService function 
 * <i>existsForType</i> to see whether or not the provided URL path the URL key 
 * of that particular object type.
 * @method exists
 * @param {function} cb A call back that provides one parameter. An object 
 * containing the result of the action: cb({code: HTTP_STATUS, content: JSON})
 */
UrlApiController.prototype.exists_for = function(cb) {
	
	var params = {
        type: this.query.type,
        id: this.query.id,
        url: this.query.url
	};
	var service = new UrlService();
	service.existsForType(params, function(err, exists) {
		if (util.isError(err)) {
			var content = BaseController.apiResponse(BaseController.API_FAILURE, err.message);
			cb({content: content, code: 500});
			return;
		}
		
		//now build response
		var content = BaseController.apiResponse(BaseController.API_SUCCESS, '', exists);
		cb({content: content});
	});
};

//exports
module.exports = UrlApiController;
