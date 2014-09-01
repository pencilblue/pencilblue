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
var PluginService  = pb.PluginService;
var TopMenuService = pb.TopMenuService;
var textCreator    = pb.plugins.getService('text_creator', 'sample');

//inheritance
util.inherits(HelloWorld, pb.BaseController);

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
HelloWorld.prototype.render = function(cb) {
	var self = this;
	
	var content = {
		content_type: "text/html",
		code: 200
	};
    
    var i     = 0;
    var items = [
        "a",
        "b",
        "c",
        "d"
    ];
	
	//get page navigation
	this.getNavigation(function(err, navigation, accountButtons) {
		
		//call service for random text
		textCreator.getText(function(err, text){
			if (pb.log.isDebug()) {
				pb.log.debug('HelloWorld: Retrieved [%s] from text service.', text);
			}
			
			self.setPageName(self.ls.get('SAMPLE_HELLO_WORLD'));
			self.ts.registerLocal('sample_plugin_icon', PluginService.genPublicPath('sample', 'imgs/sample.ico'));
			self.ts.registerLocal('sample_text', text);
			self.ts.registerLocal('navigation', new pb.TemplateValue(navigation, false));
			self.ts.registerLocal('account_buttons', accountButtons);
            self.ts.registerLocal('items', function(flag, cb) {
                if (i >= items.length) {
                    
                    //we are done iterating so we shouldn't continue to 
                    //reprocess content.
                    self.ts.setReprocess(false);
                    cb(null, '');
                    return;
                }
                
                //make sure the flag appended to the end is processed
                self.ts.setReprocess(true);
                
                var content = '<li>'+items[i++]+'</li>^items^';
                cb(null, new pb.TemplateValue(content, false));
            });
			self.ts.load(path.join('sample', 'index'), function(err, template) {
				if (util.isError(err)) {
					content.content = '<html><head><title>'+self.getPageName()+'</title></head><body><pre>'+err.stack+'</pre></body></html>';
                    return;
				}
                
				content.content = template;
				cb(content);
			});
		});
	});
};

/**
 * Retrieves the navigation for the page.
 * @param {function} cb Callback that provides three parameters: cb(Error, navigation, accountButtons);
 */
HelloWorld.prototype.getNavigation = function(cb) {
    
    var options = {
        currUrl: this.req.url
    };
	TopMenuService.getTopMenu(this.session, this.localizationService, options, function(themeSettings, navigation, accountButtons) {
        TopMenuService.getBootstrapNav(navigation, accountButtons, function(navigation, accountButtons) {
        	cb(null, navigation, accountButtons);
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
module.exports = HelloWorld;