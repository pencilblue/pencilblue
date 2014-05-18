function UrlApiController() {};

//dependencies
var BaseController      = pb.BaseController;
var ApiActionController = pb.ApiActionController;
var UrlService          = pb.UrlService;

//inheritance
util.inherits(UrlApiController, ApiActionController);

//constants
var ACTIONS = {
	exists: false,
	exists_for: false
};

UrlApiController.prototype.getActions = function() {
	return ACTIONS;
};

UrlApiController.prototype.validatePathParameters = function(action, cb) {
	cb(null, []);
};

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

UrlApiController.prototype.exists = function(cb) {
	var themes  = UrlService.exists(this.query.url);
	
	//now build response
	var content = BaseController.apiResponse(BaseController.API_SUCCESS, '', themes);
	cb({content: content});
};

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