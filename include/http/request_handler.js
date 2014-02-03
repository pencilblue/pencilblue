/**
 * req Handler - Responsible for processing a single req by delegating it to the correct controllers
 */
function RequestHandler(server, req, resp){
	this.startTime = (new Date()).getTime();
	this.server    = server;
	this.req       = req;
	this.resp      = resp;
	this.url       = url.parse(req.url, true);
}

RequestHandler.DEFAULT_THEME = 'pencilblue';

RequestHandler.storage = [];
RequestHandler.index   = {};

RequestHandler.CORE_ROUTES = [
    {
    	method: 'get',
    	path: "/setup",
    	access_level: 0,
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'setup.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/setup",
    	access_level: 0,
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'setup.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/login",
    	access_level: 0,
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'login.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/login",
    	access_level: 0,
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'login.js'),
    	content_type: 'text/html'
    }
];

RequestHandler.init = function(){
	
	//iterate core routes adding them
	pb.log.debug('RequestHandler: Registering System Routes');
	for (var i = 0; i < RequestHandler.CORE_ROUTES.length; i++) {
		var descriptor = RequestHandler.CORE_ROUTES[i];

		//register the route
		RequestHandler.registerRoute(descriptor, RequestHandler.DEFAULT_THEME);
	}
};

RequestHandler.generateRedirect = function (location) {
	return {
		redirect: location
	};
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
	
	//standardize http method (if exists) to upper case
	if (descriptor.method !== undefined) {
		descriptor.method = descriptor.method.toUpperCase();
	}
	
	//clean up path
	var path = descriptor.path;
	if (path.indexOf('/') == 0) {
		path = path.substring(1);
	}
	if (path.lastIndexOf('/') == path.length - 1) {
		path = path.substring(0, path.length - 1);
	}
	
	var pathVars = {};
	var pattern = '^';
	var pathPieces = path.split('/');
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
	pattern += '[/]{0,1}$';
	
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
	
	pb.log.debug("RequestHandler: Registered Route - Theme ["+theme+"] Path ["+descriptor.path+"] Patthern ["+pattern+"]");
	return true;
};

RequestHandler.prototype.handleRequest = function(){
	
	//fist things first check for public resource
	if (RequestHandler.isPublicRoute(this.url.pathname)) {
		this.servePublicContent();
		return;
	}
	
	//check for session cookie
	this.req.headers[pb.SessionHandler.COOKIE_HEADER] = RequestHandler.parseCookies(this.req);
	this.setSessionCookie = Object.keys(this.req.headers[pb.SessionHandler.COOKIE_HEADER]).length == 0;
	
	//get locale preference
	this.localizationService = new pb.Localization(this.req);
    
    // /include/router.js
    //var route = new Route(this.req, this.resp);
    //route.route();
    
    //open session
	var self = this;
    pb.session.open(this.req, function(err, session){
    	self.onSessionRetrieved(err, session);
    });
};

RequestHandler.prototype.servePublicContent = function() {
	
	var self         = this;
	var urlPath      = this.url.pathname;//.substring('/public/'.length);
	var absolutePath = path.join(DOCUMENT_ROOT, 'public', urlPath);
	fs.readFile(absolutePath, function(err, content){
		if (err) {
			self.server404();
			return;
		}
		
		//build response structure
		var data = {
			content: content
		};
		
		//guess at content-type
		var map = {
			js: 'text/javascript',
			css: 'text/css'
		};
		var index = absolutePath.lastIndexOf('.');
		if (index >= 0) {
			var mime = map[absolutePath.substring(index + 1)];
			if (mime != undefined) {
				data.content_type = mime;
			}
		}
		
		//send response
		self.writeResponse(data);
	});
};

RequestHandler.isPublicRoute = function(path){
	var publicRoutes = ['/js/', '/css/', '/fonts/', '/img/', '/localization/', 'favicon.ico'];
	for (var i = 0; i < publicRoutes.length; i++) {
		if (path.indexOf(publicRoutes[i]) == 0) {
			return true;
		}
	}
	return false;
};

RequestHandler.prototype.server404 = function() {
	//TODO implement 404 handling
	this.writeResponse({content: 'Url ['+this.url.href+'] could not be found on this server'});
	
	if (pb.log.isSilly()) {
		pb.log.silly("RequestHandler: No Route Found, Sending 404 for URL="+this.url.href);
	}
};

RequestHandler.prototype.onSessionRetrieved = function(err, session) {
	if (err) {
		this.onErrorOccurred(err);
		return;
	}
	
	//set the session
	this.session = session;
	
	//find the controller to hand off to
	var route = this.getRoute(this.url.pathname);
	if (route == null) {
		this.server404();
		return;
	}
	this.route = route;
	
	//get active theme
	var self = this;
	pb.settings.get('active_theme', function(activeTheme){
		self.onThemeRetrieved(activeTheme == null ? RequestHandler.DEFAULT_THEME : activeTheme, route);
	});
};

RequestHandler.prototype.getRoute = function(path) {
	
	var route = null;
	for (var i = 0; i < RequestHandler.storage.length; i++) {
		
		var curr   = RequestHandler.storage[i];
		
		//test method when exists
		if (curr.method !== undefined && curr.method !== this.req.method) {
			if (pb.log.isSilly()) {
				pb.log.silly('RequestHandler: Skipping Path ['+path+'] becuase Method ['+this.request.method+'] does not match ['+curr.method+']');
			}
			continue;
		}
		var result = curr.expression.test(path);
		
		if (pb.log.isSilly()) {
			pb.log.silly('RequestHandler: Comparing Path ['+path+'] to Pattern ['+curr.pattern+'] Result ['+result+']');
		}
		if (result) {
			route = curr;
			break;
		}
	}
	return route;
};

RequestHandler.prototype.onThemeRetrieved = function(activeTheme, route) {
	
	//check for unregistered route for theme
	if (typeof route[activeTheme] == 'undefined') {
		activeTheme = RequestHandler.DEFAULT_THEME;
	}
	
	//TODO verify permissions
	
	//extract path variables
	var pathVars = {};
	var pathParts = this.url.pathname.split('/');
	for (var field in route.path_vars) {
		pathVars[field] = pathParts[route.path_vars[field]];
	}
	
	//execute controller
	var self            = this;
	var ControllerType  = route[activeTheme].controller;
	var cInstance       = new ControllerType();
	
	var props = {
		request: this.req,
		response: this.resp,
		session: this.session,
		localization_service: this.localizationService,
		path_vars: pathVars,
		query: this.url.query
	};
	cInstance.init(props, function(){
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
	this.writeResponse(data);
	if (pb.log.isDebug()) {
		pb.log.debug("Response Time: "+(new Date().getTime() - this.startTime)+"ms URL="+this.req.url);
	}
	
	//close session after data sent
	pb.session.close(this.session, function(err, result) {
		//TODO handle any errors
	});
};

RequestHandler.prototype.writeResponse = function(data){
    
    //infer a response code when not provided
    if(typeof data.code === 'undefined'){
        code = 200;
    }
    
    //set cookies
    var cookies = new Cookies(this.req, this.resp);
    if (this.setSessionCookie) {
    	cookies.set(pb.SessionHandler.COOKIE_NAME, pb.SessionHandler.getSessionCookie(this.session));
    }
    if(typeof data.cookie !== 'undefined') {
        cookies.set(data.cookie.name, data.cookie);
    }
    
    // If a response code other than 200 is provided, force that code into the head
    var contentType = 'text/html';
    if (typeof data.content_type !== 'undefined') {
    	contentType = data.content_type;
    }
    else if (this.route && typeof this.route.content_type !== 'undefined') {
    	contentType = this.route.content_type;
    }
    
    //send response
    this.resp.setHeader('content-type', contentType);
    this.resp.writeHead(code);
    this.resp.end(data.content);
};


RequestHandler.prototype.writeCookie = function(descriptor, cookieStr){
	cookieStr = cookieStr ? cookieStr : '';
	
	for(var key in descriptor) {
        cookieStr += key + '=' + descriptor[key]+'; ';
    }
	return cookieStr;
};

RequestHandler.prototype.doRedirect = function(location) {
	this.resp.statusCode = 302;
    this.resp.setHeader("Location", location);
    this.resp.end();
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