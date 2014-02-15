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
    	setup_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'setup.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/setup",
    	access_level: 0,
    	auth_required: false,
    	setup_required: false,
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
    },
    {
    	method: 'get',
    	path: "/admin",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'index.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/logout",
    	access_level: 0,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'logout.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/",
    	access_level: 0,
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'index.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/sections",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'sections.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/sections/section_map",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'sections', 'section_map.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/sections/new_section",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'sections', 'new_section.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/sections/new_section",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'sections', 'new_section.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/sections/section_map",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'sections', 'section_map.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/sections/edit_section",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'sections', 'edit_section.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/actions/admin/content/sections/delete_section",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'sections', 'delete_section.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/sections/edit_section",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'sections', 'edit_section.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/topics/manage_topics",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'topics', 'manage_topics.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/site_settings/configuration",
    	access_level: ACCESS_ADMINISTRATOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'site_settings', 'configuration.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/site_settings/content",
    	access_level: ACCESS_ADMINISTRATOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'site_settings', 'content.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/site_settings/content",
    	access_level: ACCESS_ADMINISTRATOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'site_settings', 'content.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/site_settings/email",
    	access_level: ACCESS_ADMINISTRATOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'site_settings', 'email.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/site_settings/email",
    	access_level: ACCESS_ADMINISTRATOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'site_settings', 'email.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/topics/new_topic",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'topics', 'new_topic.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/topics/new_topic",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'topics', 'new_topic.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/topics/import_topics",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'topics', 'import_topics.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/topics/import_topics",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'topics', 'import_topics.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/topics/",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'topics.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/pages/new_page",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'pages', 'new_page.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/pages/manage_pages",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'pages', 'manage_pages.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/pages/edit_page",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'pages', 'edit_page.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/pages/delete_page",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'pages', 'delete_page.js'),
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
	
	pb.log.debug("RequestHandler: Registered Route - Theme ["+theme+"] Path ["+descriptor.path+"] Pattern ["+pattern+"]");
	return true;
};

RequestHandler.prototype.handleRequest = function(){
	
	//fist things first check for public resource
	if (RequestHandler.isPublicRoute(this.url.pathname)) {
		this.servePublicContent();
		return;
	}
	
	//check for session cookie
	var cookies = RequestHandler.parseCookies(this.req);
	this.req.headers[pb.SessionHandler.COOKIE_HEADER] = cookies;
	
	//get locale preference
	this.localizationService = new pb.Localization(this.req);
    
    // /include/router.js
//	var self = this;
//	this.req.on('data', function(chunk)
//    {
//        if(typeof self.req.headers['post'] == 'undefined')
//        {
//            self.req.headers['post'] = '';
//        }
//        self.req.headers['post'] += chunk;
//    });
//    var route = new Route(this.req, this.resp);
//    route.route();
    
    //open session
	var self = this;
    pb.session.open(this.req, function(err, session){
    	
    	//set the session id when no session has started or the current one has 
    	//expired.
    	var sc = Object.keys(cookies).length == 0;
    	var se = !sc && cookies.session_id != session.uid;
    	self.setSessionCookie =  sc || se;
    	if (pb.log.isSilly()) {
    		pb.log.silly("RequestHandler: Session ID ["+session.uid+"] Cookie SID ["+cookies.session_id+"] Created ["+sc+"] Expired ["+se+"]");
    	}
    	
    	//continue processing
    	self.onSessionRetrieved(err, session);
    });
};

RequestHandler.prototype.servePublicContent = function() {
	
	var self         = this;
	var urlPath      = this.url.pathname;
	var absolutePath = path.join(DOCUMENT_ROOT, 'public', urlPath);
	fs.readFile(absolutePath, function(err, content){
		if (err) {
			self.serve404();
			return;
		}
		
		//build response structure
		var data = {
			content: content
		};
		
		//guess at content-type
		var map = {
			js: 'text/javascript',
			css: 'text/css',
			png: 'image/png',
			svg: 'image/svg+xml',
			ico: 'image/vnd.microsoft.icon',
			tff: 'application/octet-stream',
			eot: 'application/vnd.ms-fontobject',
			woff: 'application/x-font-woff'
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

/**
 * 
 * @param path
 * @returns {Boolean}
 */
RequestHandler.isPublicRoute = function(path){
	var publicRoutes = ['/js/', '/css/', '/fonts/', '/img/', '/localization/', 'favicon.ico'];
	for (var i = 0; i < publicRoutes.length; i++) {
		if (path.indexOf(publicRoutes[i]) == 0) {
			return true;
		}
	}
	return false;
};

RequestHandler.prototype.serve404 = function() {
	//TODO implement 404 handling
	this.onRenderComplete({content: 'Url ['+this.url.href+'] could not be found on this server'});
	
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
		this.serve404();
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
	var self = this;
	
	//check for unregistered route for theme
	if (typeof route[activeTheme] == 'undefined') {
		activeTheme = RequestHandler.DEFAULT_THEME;
	}
	
	//do security checks
	this.checkSecurity(activeTheme, function(err, result) {
		if (pb.log.isDebug()) {
			pb.log.debug("RequestHandler: Security Result="+result.success);
			for (var key in result.results) {
				pb.log.debug("RequestHandler:"+key+': '+JSON.stringify(result.results[key]));
			}
		}
		//all good
		if (result.success) {
			self.onSecurityChecksPassed(activeTheme, route);
			return;
		}
		
		//handle failures through bypassing other processing and doing output
		self.onRenderComplete(err);
	});	
};

RequestHandler.prototype.onSecurityChecksPassed = function(activeTheme, route) {
	
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

RequestHandler.prototype.checkSecurity = function(activeTheme, cb){
	var self       = this;
	var themeRoute = this.route[activeTheme];
	
	//verify if setup is needed
	var checkSystemSetup = function(callback) {
		var result = {success: true};
		if (themeRoute.setup_required == undefined || themeRoute.setup_required == true) {
			pb.settings.get('system_initialized', function(err, isSetup){
				
				//verify system init
				if (!isSetup) {
					result.success = false;
					result.redirect = '/setup';
					callback(result, result);
					return;
				}
				callback(null, result);				
			});
		}
		else {
			callback(null, result);
		}
	};
	
	var checkRequiresAuth = function(callback) {

		var result = {success: true};
		if (themeRoute.auth_required == true) {
			
			if (self.session.authentication.user_id == null || self.session.authentication.user_id == undefined) {
				result.success  = false;
				result.redirect = '/admin/login';
				self.session.on_login = self.url.href;
				callback(result, result);
				return;
			}
			callback(null, result);
		}
		else{
			callback(null, result);
		}
	};
	
	var checkAdminLevel = function(callback) {
		
		var result = {success: true};
		if (themeRoute.access_level != undefined) {

			if (self.session.authentication.admin_level < themeRoute.access_level) {
				result.success = false;
				result.content = '403 Forbidden';
				result.code    = 403;
				callback(result, result);
				return;
			}
			callback(null, result);
		}
		else{
			callback(null, result);
		}
	};
	
	var tasks = {
		checkSystemSetup: checkSystemSetup,
        checkRequiresAuth: checkRequiresAuth,
        checkAdminLevel: checkAdminLevel
	};
	async.series(tasks, function(err, results){
		if (err) {
			cb(err, {success: false, results: results});
			return;
		}
		
		cb(null, {success: true, results: results});
	});
};

RequestHandler.prototype.onControllerInitialized = function(controller) {
	var self = this;
	controller.render(function(result){
		self.onRenderComplete(result);
	});
};

RequestHandler.prototype.onRenderComplete = function(data){
	
	//set cookie
    var cookies = new Cookies(this.req, this.resp);
    if (this.setSessionCookie) {
    	cookies.set(pb.SessionHandler.COOKIE_NAME, this.session.uid, pb.SessionHandler.getSessionCookie(this.session));
    }
	
	//do any necessary redirects
	var doRedirect = typeof data.redirect != "undefined";
	if(doRedirect) {
        this.doRedirect(data.redirect);
    }
	else {
		//output data here
		this.writeResponse(data);
	}
	
	//calculate response time
	if (pb.log.isDebug()) {
		pb.log.debug("Response Time: "+(new Date().getTime() - this.startTime)+"ms URL=["+this.req.method+']'+this.req.url+(doRedirect ? ' Redirect='+data.redirect : ''));
	}
	
	//close session after data sent
	//public content doesn't require a session so in order to not error out we check if the session exists first.
	if (this.session) {
		pb.session.close(this.session, function(err, result) {
			//TODO handle any errors
		});
	}
};

RequestHandler.prototype.writeResponse = function(data){
    
    //infer a response code when not provided
    if(typeof data.code === 'undefined'){
        code = 200;
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
