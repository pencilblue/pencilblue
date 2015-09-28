/*
    Copyright (C) 2015  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

//dependencies
var path = require('path');

module.exports = function RandomTextViewControllerModule(pb) {
    
    //PB dependencies
    var util           = pb.util;
    var PluginService  = pb.PluginService;
    var TopMenuService = pb.TopMenuService;

    /**
     * RandomTextViewController - A sample controller to show how to register a 
     * controller and 
     * routes for the controller.
     * @class RandomTextViewController
     * @constructor
     * @extends BaseController
     */
    function RandomTextViewController(){}
    util.inherits(RandomTextViewController, pb.BaseController);

    /**
     * This is the function that will be called by the system's RequestHandler.  It 
     * will map the incoming route to the ones below and then instantiate this 
     * prototype.  The request handler will then proceed to call this function.  
     * Its callback should contain everything needed in order to provide a response.
     * 
     * @method getRandomText
     * @see BaseController#render
     * @param cb The callback.  It does not require a an error parameter.  All 
     * errors should be handled by the controller and format the appropriate
     * response.  The system will attempt to catch any catastrophic errors but 
     * makes no guarantees.
     */
    RandomTextViewController.prototype.getRandomText = function(cb) {
        var self = this;

        //PencilBlue provides access to function to retrieve the navigation and 
        //account buttons that are displayed at the top of pages.  These values 
        //must be plugged into the template service in order to be displayed.  
        //Templates can reference the "head" and "footer" templates inside of the 
        //loaded template to ensure that the view is wrapped by the navigation and 
        //footer.
        this.getNavigation(function(err, navItems) {

            //Create an instance of the text service.  Then we call the service for 
            //random text
            var TextService = PluginService.getService('textService', 'sample', self.site);
            var textService = new TextService();
            var text        = textService.getText();

            //The global "pb" object provides access to a number of services.  One 
            //of those is logging.  
            if (pb.log.isDebug()) {
                pb.log.debug('RandomTextViewController: Retrieved [%s] from text service.', text);
            }

            //The base controller is initialized by the request handler.  As part 
            //of that an instance of the Localization service is created.  The 
            //localization service determines the most appropriate language based 
            //on the "language" header sent from the client.  Defaults to english.
            var pageName = self.ls.get('SAMPLE_HELLO_WORLD');

            //Inheriting from the base controller provides some utility functions 
            //for common items.  The setPageName function instructs the templating 
            //service to set the ^title^ flag to the value passed to it.
            self.setPageName(pageName);

            //Each controller inheriting from the BaseController is provided an 
            //instance of the TemplateService.  The template service is used to 
            //process template files and render a view.  The template service 
            //provides some flags out of the box.  For example, "^year^" is 
            //provided out of the box to provide the current 4 digit year.  In 
            //addition, developers can specifiy their own flags that will be replaced 
            //with values when encountered by the template service.  The 
            //"registerLocal" and "registerGlobal" functions accept raw values or 
            //functions.  Additionally, a model object can be defined and passed 
            //to the "registerModel" function in order to keep the functional calls 
            //to a minimum.
            var model = {
                'sample_plugin_icon': PluginService.genPublicPath('sample', 'imgs/sample.ico'),
                
                'sample_text': text,
                
                //The templating service also supports registering flags with functions.  
                //The allows controllers to execute complex features only when the flag 
                //is actually encountered.  This is primarily beneficial when 
                //functionality is abstracted in a common controller prototype.
                'parameterized_text': function(flag, cb) {


                    //The localization service also supports parameterized localizations 
                    //to handle cases where different languages structure subjects and 
                    //predicates differently.
                    var options = {
                        defaultVal: 'The Key Was Not Found',
                        defaultParamVal: 'N/A',
                        params: { 
                            someString: 'apple', 
                            someNumber: 28, 
                            json: JSON.stringify({ some: 'value'})
                        }
                    };
                    var parameterizedLocalizedStr = self.ls.g('PARAMETERIZED_KEY', options);
                    cb(null, parameterizedLocalizedStr);
                },
                
                //by default, the template service HTML encodes all template flags. 
                //Values provided to template service can be wrapped in an 
                //TemplateValue which contains an option to skip the encoding if the 
                //value itself is HTML. 
                'navigation': new pb.TemplateValue(navItems.navigation, false),
                
                'account_buttons': new pb.TemplateValue(navItems.accountButtons, false),
                
                //the service also supports nested objects and keys.  
                parent: {
                    
                    child: {
                        
                        name: "Billy Bob"
                    }
                }
            };

             
            //self.ts.registerLocal('navigation', new pb.TemplateValue(navItems.navigation, false));
            //self.ts.registerLocal('account_buttons', navItems.accountButtons);

            //The template service is pretty simple.  More complex features such as 
            //loops are handled by providing a function to the template service 
            //where ever an iteration is needed.  In this example we have a list of 
            //items to be displayed.  
            var i     = 0;
            var items = [
                "a",
                "b",
                "c",
                "d"
            ];
            model.items = function(flag, cb) {
                if (i >= items.length) {

                    //we are done iterating so we shouldn't continue to 
                    //reprocess content.
                    self.ts.setReprocess(false);
                    cb(null, '');
                    return;
                }

                //In order to ensure we process the whole list of items we append 
                //the the triggering flag to the end of the content we generate for 
                //a single item.  In addition, we must tell the template service to 
                //reprocess the values that are returned by executing the function 
                //for a flag. In this context the template file being processed 
                //contains the flag "^items^".  When the flag is encountered this 
                //function is executed.  The content for the first item is created 
                //with the flag appended to the end.  The template service will 
                //then take the value provided by the callback and process it 
                //looking for additional flags.  
                self.ts.setReprocess(true);

                var content = '<li>'+items[i++]+'</li>^items^';

                //the "content" is wrapped in a template value with "false" passed 
                //as the second argument to specify that the value should not be 
                //HTML encoded.
                cb(null, new pb.TemplateValue(content, false));
            };
            
            //here we register the model so that our values will be rendered in 
            //the view
            self.ts.registerModel(model/*, optional model name can be provided here */);

            //to generate the rendered view the template service can be called.  
            //The path specified to the template service is relative to the 
            //templates directory of the plugin or active theme.  The .html 
            //extension is implied and does not have to be specified. For 
            //convience the "path" module has been made global by the PB core.  
            //While it appears that paths with forward '/' characters are 
            //interpreted correctly on windows systems it is better to be safe an 
            //use the "path" module to path parts correctly.
            self.ts.load(path.join('sample', 'index'), function(err, template) {
                if (util.isError(err)) {

                    //when an error occurs it is possible to hand back off to the 
                    //RequestHandler to serve the error.
                    self.reqHandler.serveError(err);
                }

                //The callback to the RequestHandler can specify more than just the 
                //content to be streamed back to the client.  The content type can 
                //be overrided as well as the HTTP status code.  The status code 
                //defaults to 200.
                var content = {
                    content_type: "text/html",
                    code: 200,
                    content: template
                };
                cb(content);
            });
        });
    };

    /**
     * Retrieves the navigation for the page.
     * @param {function} cb Callback that provides two parameters: 
     * cb(Error, {navigation "", accountButtons: "", themeSettings: {}});
     */
    RandomTextViewController.prototype.getNavigation = function(cb) {

        //build out options starting with a service context object.  It 
        //contains all the good stuff like localization, template service, 
        //activeTheme, and session.
        var options = this.getServiceContext();
        options.currUrl = this.req.url;
        
        //create a new instance of the top menu service and request the navigation items
        var service = new TopMenuService();
        service.getNavItems(options, cb);
    };
    
    /**
     * A sample redirect endpoint
     * @method redirectToHomepage
     * @params {Function} cb
     */
    RandomTextViewController.prototype.redirectToHomePage = function(cb) {
        this.redirect('/', cb);
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
    RandomTextViewController.getRoutes = function(cb) {
        var routes = [
            {
                //This is the HTTP verb that should be used for the route.  If none 
                //is provided it is assumed to be executed for all routes.
                method: 'get',

                //This is the URL pattern that will be used to match against 
                //incoming requests to determine if this the controller to execute. 
                //The route handler supports parameters and wild cards such as: 
                //"/user/:id/*
                path: "/sample/random/text",

                //indicates if the route requires the user to be authenticated in 
                //order to access the resource.  Defaults to false.
                auth_required: true,

                //specifies the role that is required of the authenticated user.  
                //Defaults to no role
                access_level: pb.SecurityService.ACCESS_USER,

                //specifies the specific persions that are required by users in 
                //order to access the resource.  The permissions are AND'ed 
                //together. Defaults to []
                permissions: ["sample_view"],

                //Indicates the content type that will be returned to the 
                //requesting client. Defaults to "text/html"
                content_type: 'text/html',

                //specifies the controller prototype instance function that will be 
                //called to handle the incoming request.  Defaults to "render"
                handler: "getRandomText"
            },
            {
                method: 'get',
                path: '/sample/redirect/home',
                handler: 'redirectToHomePage'
            },
    //		{ //Use the setup below to override the home page when your plugin is set as the active theme
    //	    	method: 'get',
    //	    	path: "/",
    //	    	auth_required: false,
    //	    	content_type: 'text/html'
    //		}
        ];
        cb(null, routes);
    };

    //exports
    return RandomTextViewController;
};