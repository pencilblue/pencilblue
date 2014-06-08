/**
 * The controller to properly route and handle remote calls to interact with the 
 * cluster.
 * 
 * @class ClusterApiController
 * @constructor
 * @extends ApiActionController
 * @module Controllers
 * @submodule API
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC. All Rights Reserved
 */
function ClusterApiController() {};

//dependencies
var BaseController      = pb.BaseController;
var ApiActionController = pb.ApiActionController;
var UrlService          = pb.UrlService;

//inheritance
util.inherits(ClusterApiController, ApiActionController);

//constants
/**
 * @private
 * @property
 * @type {object}
 */
var ACTIONS = {
	refresh: false,
};

/**
 * Provides the hash of all actions supported by this controller
 * @method getActions
 * @see ApiActionController#getActions
 * @returns {object
 */
ClusterApiController.prototype.getActions = function() {
	return ACTIONS;
};

/**
 * 
 *
 */
ClusterApiController.prototype.refresh = function(cb) {
    pb.ServerRegistration.flush(function(err, result) {
        var content = BaseController.apiResponse(BaseController.API_SUCCESS, '', {wait: pb.config.registry.update_interval});
        cb({content: content}); 
    });
};

//exports
module.exports = ClusterApiController;
