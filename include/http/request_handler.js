/**
 * req Handler - Responsible for processing a single req by delegating it to the correct controllers
 */
function RequestHandler(server, req, resp){
	this.startTime = (new Date()).getTime();
	this.server    = server;
	this.req       = req;
	this.resp      = resp;
	this.url       = url.parse(req.url);
}

RequestHandler.DEFAULT_THEME = 'pencilblue';

RequestHandler.storage = [];
RequestHandler.index   = {};

RequestHandler.CORE_ROUTES = [
    {
    	path: "/setup",
    	access_level: 0,
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'setup.js')
    }
];

RequestHandler.init = function(){
	
	//iterate core routes adding them
	for (var i = 0; i < RequestHandlre.CORE_ROUTES.length; i++) {
		var descriptor = RequestHandlre.CORE_ROUTES[i];

		//register the route
		RequestHandler.registerRoute(descriptor, RequestHandler.DEFAULT_THEME);
	}
};

RequestHandler.isValidRoute = function(descriptor) {
	return fs.existsSync(descriptor.controller) &&
		   typeof descriptor.path != 'undefined';
};

RequestHandler.registerRoute = function(descriptor, theme){
	//validate route
	if (!RequestHandler.isValidRoute(descriptor)) {
		pb.log.error("Route Validation Failed for: "+JSON.stringify(descriptor));
		return false;
	}
	
	var pathVars = {};
	var pattern = '';
	var pathPieces = descriptor.path.split('/');
	for (var i = 0; i < pathPieces.length; i++) {
		
		var piece = pathPieces[i];
		if (piece.indexOf(':') == 0) {
			var fieldName = piece.substring(1);
			pathVars[fieldName] = i;
			pattern += '/[A-Za-z0-9_\-]+';
		}
		else {
			pattern += '/'+piece;
		}
	}
	
	//insert it
	var routeDescriptor = null;
	if (RequestHandler.index[pattern] == true) {
		
		//exists so find it
		for (var i = 0; i < RequestHandler.storage.length; i++) {
			var route = RequestHandler.storage[i];
			if (route.pattern == pattern) {
				routeDescriptor = route;
				break;
			}
		}
	}
	else{//does not exist so create it
		routeDescriptor = {
			pattern: pattern,
			path_vars: pathVars,
			expression: new RegExp(pattern)
		};
		
		//set them in storage
		RequestHandler.storage.push(routeDescriptor);
		RequestHandler.index[pattern] = true;
	}
	
	//set the descriptor for the theme and load the controller type
	routeDescriptor[theme]            = descriptor;
	routeDescriptor[theme].controller = require(descriptor.controller);
};

RequestHandler.prototype.handleRequest = function(){
	
	this.req.headers[pb.SessionHandler.COOKIE_HEADER] = RequestHandler.parseCookies(this.req);
	this.localizationService = new pb.Localization(this.req);
    
	//pull down post data
    var instance = this;
    this.req.on('data', function(chunk) {
        if (typeof instance.req.headers['post'] == 'undefined') {
        	instance.req.headers['post'] = '';
        }
        instance.req.headers['post'] += chunk;
    });
    
    // /include/router.js
    var route = new Route(this.req, this.resp);
    route.route();
    
    //open session
    pb.sesson.open(req, function(err, session){
    	instance.onSessionRetrieved(err, result);
    });
};

RequestHandler.prototype.onSessionRetrieved = function(err, session) {
	if (err) {
		this.onErrorOccurred(err);
		return;
	}
	
	//set the session
	this.session = session;
	
	//find the controller to hand off to
	var route = null;
	for (var i = 0; i < RequestHandler.storage.length; i++) {
		
		var curr = RequestHandler.storage[i];
		if (curr.expression.test(this.url.pathname)) {
			route = curr;
			break;
		}
	}
	
	if (route == null) {
		//do 404
		pb.log.silly("No Route Found: Sending 404 for URL="+this.url.href);
		return;
	}
	
	//get active theme
	var self = this;
	pb.settings.get('active_theme', function(activeTheme){
		self.onThemeRetrieved(activeTheme == null ? RequestHandler.DEFAULT_THEME : activeTheme, route);
	});
};

RequestHandler.prototype.onThemeRetrieved = function(activeTheme, route) {
	
	//check for unregistered route for theme
	if (typeof route[activeTheme] == 'undefined') {
		activeTheme = RequestHandler.DEFAULT_THEME;
	}
	
	//verify permissions
	
	
	//execute controller
	var self            = this;
	var ControllerType  = route[activeTheme].controller;
	var cInstance       = new ControllerType();
	cInstance.init(this.req, this.resp, this.session, this.localizationService, function(){
		self.onControllerInitialized(cInstance);
	});
};

RequestHandler.prototype.onControllerInitialized = function(controller) {
	var self = this;
	controller.render(function(result){
		self.onRenderComplete(result);
	});
};

RequestHandler.prototype.onRenderComplete = function(data){
	if(typeof data.redirect != "undefined") {
        this.doRedirect(data.redirect);
        return;
    }
	
	//output data here
	//TODO look at ResponseHead
	
	pb.log.debug("Response Time: "+(new Date().getTime() - this.startTime)+"ms URL="+this.request.url);
};

RequestHandler.prototype.doRedirect = function(location) {
	this.response.statusCode = 302;
    this.response.setHeader("Location", location);
    this.response.end();
};

RequestHandler.prototype.onErrorOccurred = function(err){
	var error = new PBError("Failed to open a session", 500);
	error.setSource(err);
	throw error;
};

RequestHandler.parseCookies = function(req){
	
	var parsedCookies = {};
	if (req.headers.cookie) {
        
        var cookieParameters = req.headers.cookie.split(';');
        for(var i = 0; i < cookieParameters.length; i++)  {
            
        	var keyVal = cookieParameters[i].split('=');
            parsedCookies[keyVal[0]] = keyVal[1];
        }
	}
    return parsedCookies;
};

module.exports.RequestHandler = RequestHandler;