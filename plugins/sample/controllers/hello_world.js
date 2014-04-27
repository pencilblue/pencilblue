/**
 * HelloWorld - A sample controller to show how to register a controller and 
 * routes for the controller.
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
 * @returns
 */
function HelloWorld(){}

//dependencies
var PluginService = pb.PluginService;
var textCreater   = pb.plugins.getService('text_creater', 'sample');

//inheritance
util.inherits(HelloWorld, pb.BaseController);

/**
 * This is the function that will be called by the system's RequestHandler.  It 
 * will map the incoming route to the ones below and then instantiate this 
 * prototype.  The request handler will then proceed to call this function.  
 * Its callback should contain everything needed in order to provide a response.
 * 
 * @param cb The callback.  It does not require a an error parameter.  All 
 * errors should be handled by the controller and format the appropriate
 *  response.  The system will attempt to catch any catastrophic errors but 
 *  makes no guarantees.
 */
HelloWorld.prototype.render = function(cb) {
	var self = this;
	
	var content = {
		content_type: "text/html",
		code: 200
	};
	
	textCreater.getText(function(err, text){
		if (pb.log.isDebug()) {
			pb.log.debug('HelloWorld: Retrieved [%s] from text service.', text);
		}
		
		self.setPageName(self.ls.get('SAMPLE_HELLO_WORLD'));
		self.ts.registerLocal('sample_plugin_icon', PluginService.genPublicPath('sample', 'imgs/sample.ico'));
		self.ts.registerLocal('sample_text', text);
		self.ts.load(path.join('sample', 'index'), function(err, template) {
			if (util.isError(err)) {
				content.content = '<html><head><title>'+self.getPageName()+'</title></head><body><pre>'+err.stack+'</pre></body></html>';
			}
			else {
				content.content = template;
			}
			cb(content);
		});
	});
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
HelloWorld.getRoutes = function(cb) {
	var routes = [
		{
	    	method: 'get',
	    	path: "/sample",
	    	auth_required: false,
	    	access_level: ACCESS_USER,
	    	permissions: ["sample_view"],
	    	content_type: 'text/html'
		}
	];
	cb(null, routes);
};

//exports
module.exports = HelloWorld;