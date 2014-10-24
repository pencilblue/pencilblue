/**
 * PresentationController - A sample controller to show how to register a controller and
 * routes for the controller.
 *
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
 * @returns
 */
function PresentationController(){}

//dependencies
var PluginService  = pb.PluginService;
var TopMenuService = pb.TopMenuService;

//inheritance
util.inherits(PresentationController, pb.BaseController);

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
PresentationController.prototype.render = function(cb) {
	var self = this;

    //get page navigation
	this.getNavigation(function(err, navigation, accountButtons) {

		var slides = [{
			url: '//www.slideshare.net/slideshow/embed_code/27593151',
			category: 'MongoDB',
			letter: 'M',
			title: 'Slide title goes here',
			color: 'green'
		}, {
			url: '//www.slideshare.net/slideshow/embed_code/27593151',
			category: 'Express',
			letter: 'E',
			title: 'Slide title goes here',
			color: 'tan'
		}, {
			url: '//www.slideshare.net/slideshow/embed_code/27593151',
			category: 'AngularJS',
			letter: 'A',
			title: 'Slide title goes here',
			color: 'red'
		}, {
			url: '//www.slideshare.net/slideshow/embed_code/27593151',
			category: 'Node.js',
			letter: 'N',
			title: 'Slide title goes here',
			color: 'blue'
		}];

        self.ts.registerLocal('slides', new pb.TemplateValue(JSON.stringify(slides), false));
        self.ts.registerLocal('navigation', new pb.TemplateValue(navigation, false));
        self.ts.registerLocal('account_buttons', accountButtons);
        self.ts.load('presentation', function(err, content) {
            cb({
                content: content,
                content_type: "text/html",
                code: 200
            });
        });
    });
};

/**
 * Retrieves the navigation for the page.
 * @param {function} cb Callback that provides three parameters: cb(Error, navigation, accountButtons);
 */
PresentationController.prototype.getNavigation = function(cb) {

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
PresentationController.getRoutes = function(cb) {
	var routes = [
		{
	    	method: 'get',
	    	path: "/presentation",
	    	auth_required: false,
	    	permissions: [],
	    	content_type: 'text/html'
		}
	];
	cb(null, routes);
};

//exports
module.exports = PresentationController;
