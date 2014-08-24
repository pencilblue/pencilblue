/**
 * HelloWorld - A sample controller to show how to register a controller and 
 * routes for the controller.
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
 * @returns
 */
function TestPage(){}

//dependencies
var PluginService  = pb.PluginService;

//inheritance
util.inherits(TestPage, pb.BaseController);

/**
 * This is the function that will be called by the system's RequestHandler.  It 
 * will map the incoming route to the ones below and then instantiate this 
 * prototype.  The request handler will then proceed to call this function.  
 * Its callback should contain everything needed in order to provide a response.
 * 
 * @method render
 * @see BaseController#render
 * @param cb The callback.  It does not require a an error parameter.  All 
 * errors should be handled by the controller and format the appropriate
 *  response.  The system will attempt to catch any catastrophic errors but 
 *  makes no guarantees.
 */
TestPage.prototype.render = function(cb) {
	var self = this;
	
	var content = {
		content_type: "text/html",
		code: 200
	};
    content.content = 'Put your API or page content here!';
    cb(content);
};

/**
 * Provides the routes that are to be handled by an instance of this prototype.  
 * The route provides a definition of path, permissions, authentication, and 
 * expected content type. 
 * Method is optional
 * Path is required
 * Permissions are optional
 * Access levels are optional
 * Content type is optional
 * 
 * @param cb A callback of the form: cb(error, array of objects)
 */
TestPage.getRoutes = function(cb) {
	var routes = [
		{
	    	method: 'get',
	    	path: "/test",
	    	auth_required: true,
	    	access_level: ACCESS_USER,
	    	permissions: ["sample_view"],
	    	content_type: 'text/html'
		},
//		{ //Use the setup below to override the home page
//	    	method: 'get',
//	    	path: "/",
//	    	auth_required: false,
//	    	content_type: 'text/html'
//		}
	];
	cb(null, routes);
};

//exports
module.exports = TestPage;