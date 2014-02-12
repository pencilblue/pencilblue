/**
 * Form Controller - Provides the basic functionality for implementing a 
 * controller that needs access to a posted form.
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC 2014 All Rights Reserved
 */
function FormController(){}

//inheritance
util.inherits(FormController, pb.BaseController);

FormController.prototype.render = function(cb) {
	var self = this;
	this.getPostParams(function(err, params) {
		if (util.isError(err)) {
			self.onPostParamsError(err, cb);
		}
		else{
			self.onPostParamsRetrieved(params, cb);
		}
	});
};

/**
 * Called when an error occurs attempting to process the post parameters.  The 
 * default implementation takes the error and sends it back to the requesting 
 * entity with a 400 Bad Request status code.
 * @param err
 * @param cb
 */
FormController.prototype.onPostParamsError = function(err, cb) {
	pb.log.silly("FormController: Error processing form parameters"+err);
	cb({content: err, code: 400});
};

/**
 * Default implementation that will echo the parameters back to the requesting 
 * entity.
 * @param params
 * @param cb
 */
FormController.prototype.onPostParamsRetrieved = function(params, cb) {
	cb({content: JSON.stringify(params)});
};

//exports
module.exports.FormController = FormController;