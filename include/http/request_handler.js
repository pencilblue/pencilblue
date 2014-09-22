/*
    Copyright (C) 2014  PencilBlue, LLC

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

/**
 * Responsible for processing a single req by delegating it to the correct controllers
 * @class RequestHandler
 * @constructor
 * @param {Server} server The http server that the request came in on
 * @param {Request} req The incoming request
 * @param {Response} resp The outgoing response
 */
function RequestHandler(server, req, resp){
	this.startTime = (new Date()).getTime();
	this.server    = server;
	this.req       = req;
	this.resp      = resp;
	this.url       = url.parse(req.url, true);
}

/**
 * The fallback theme (pencilblue)
 * @static
 * @property DEFAULT_THEME
 * @type {String}
 */
RequestHandler.DEFAULT_THEME = 'pencilblue';

RequestHandler.storage = [];
RequestHandler.index   = {};

RequestHandler.CORE_ROUTES = require(path.join(DOCUMENT_ROOT, '/plugins/pencilblue/include/routes.js'));

/**
 * Initializes the request handler prototype by registering the core routes for
 * the system.  This should only be called once at startup.
 * @static
 * @method init
 */
RequestHandler.init = function(){

	//iterate core routes adding them
	pb.log.debug('RequestHandler: Registering System Routes');
	for (var i = 0; i < RequestHandler.CORE_ROUTES.length; i++) {
		var descriptor = RequestHandler.CORE_ROUTES[i];

		//register the route
		RequestHandler.registerRoute(descriptor, RequestHandler.DEFAULT_THEME);
	}
};

/**
 * Generates the controller callback object that will trigger the redirect
 * header to be sent back as part of the response.
 * @static
 * @method generateRedirect
 * @param {String} location The fully qualified or relative URL to be redirected to
 * @return {Object} The object for the controller to call back with.
 */
RequestHandler.generateRedirect = function (location) {
	return {
		redirect: location
	};
};

/**
 * Validates a route descriptor.  The specified object must have a "controller"
 * property that points to a valid file and the "path" property must specify a
 * valid URL path structure.
 * @static
 * @method isValidRoute
 * @param {Object} descriptor The object to validate
 * @param {String} descriptor.controller The file path to the controller file
 * @param {String} descriptor.path The URL path
 */
RequestHandler.isValidRoute = function(descriptor) {
	return fs.existsSync(descriptor.controller) &&
		   typeof descriptor.path != 'undefined';
};

/**
 * Unregisters all routes associated with a theme
 * @static
 * @method unregisterThemeRoutes
 * @param {String} theme The plugin/theme uid
 * @return {Integer} The number of routes removed
 */
RequestHandler.unregisterThemeRoutes = function(theme) {

	var routesRemoved = 0;
	for (var i = 0; i < RequestHandler.storage.length; i++) {
		var path   = RequestHandler.storage[i].path;
		var result = RequestHandler.unregisterRoute(path, theme);
		if (result) {
			routesRemoved++;
		}
	}
	return routesRemoved;
};

/**
 * Removes a route based on a URL path and theme UID
 * @static
 * @method unregisterRoute
 * @param {String} The URL path
 * @param {String} The theme that owns the route
 * @return {Boolean} TRUE if the route was found and removed, FALSE if not
 */
RequestHandler.unregisterRoute = function(path, theme) {

	//get the pattern to check for
	var pattern    = null;
	var patternObj = RequestHandler.getRoutePattern(path);
	if (patternObj) {
		pattern = patternObj.pattern;
	}
	else {//invalid path provided
		return false;
	}

	//check if that pattern is registered for any theme
	if (RequestHandler.index[pattern] === undefined) {
		return false;
	}

	//check for theme
	var descriptor = RequestHandler.storage[RequestHandler.index[pattern]];
	if (!descriptor.themes[theme]) {
		return false;
	}

	//remove from service
	delete descriptor.themes[theme];
	return true;
};

/**
 * Registers a route
 * @static
 * @method registerRoute
 * @param {Object} descriptor The route descriptor
 * @param {String} [descriptor.method='ALL'] The HTTP method associated with
 * the route
 * @param {String} descriptor.path The URL path for the route.  The route
 * supports wild cards a well as path variables (/get/:id)
 * @param {String} descriptor.controller The file path to the controller to
 * execute when the path is matched to an incoming request.
 * @param {Integer} [descriptor.access_level=0] Use global constants:
 * ACCESS_USER,ACCESS_WRITER,ACCESS_EDITOR,ACCESS_MANAGING_EDITOR,ACCESS_ADMINISTRATOR
 * @param {Boolean} [descriptor.setup_required=true] If true the system must have gone
 * through the setup process in order to pass validation
 * @param {Boolean} [descriptor.auth_required=false] If true, the user making the
 * request must have successfully authenticated against the system.
 * @request {String} [descriptor.content_type='text/html'] The content type header sent with the response
 * @param {String} theme The plugin/theme UID
 * @return {Boolean} TRUE if the route was registered, FALSE if not
 */
RequestHandler.registerRoute = function(descriptor, theme){
	//validate route
	if (!RequestHandler.isValidRoute(descriptor)) {
		pb.log.error("Route Validation Failed for: "+JSON.stringify(descriptor));
		return false;
	}

	//standardize http method (if exists) to upper case
	if (descriptor.method) {
		descriptor.method = descriptor.method.toUpperCase();
	}
    else {
        descriptor.method = 'ALL'
    }

	//get pattern and path variables
	var patternObj = RequestHandler.getRoutePattern(descriptor.path);
	var pathVars   = patternObj.pathVars;
	var pattern    = patternObj.pattern;

	//insert it
	var routeDescriptor = null;
	if (RequestHandler.index[pattern] !== undefined) {

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
			path: patternObj.path,
			pattern: pattern,
			path_vars: pathVars,
			expression: new RegExp(pattern),
            themes: {}
		};

		//set them in storage
		RequestHandler.index[pattern] = RequestHandler.storage.length;
		RequestHandler.storage.push(routeDescriptor);
	}

	//set the descriptor for the theme and load the controller type
    if (!routeDescriptor.themes[theme]) {
        routeDescriptor.themes[theme] = {};
    }
	routeDescriptor.themes[theme][descriptor.method]            = descriptor;
	routeDescriptor.themes[theme][descriptor.method].controller = require(descriptor.controller);

	pb.log.debug("RequestHandler: Registered Route - Theme [%s] Path [%s][%s] Pattern [%s]", theme, descriptor.method, descriptor.path, pattern);
	return true;
};

/**
 * Generates a regular expression based on the specified path.  In addition the
 * algorithm extracts any path variables that are included in the path.  Paths
 * can include two types of wild cards.  The traditional glob pattern style of
 * "/some/api/*" can be used as well as path variables ("/some/api/:action").
 * The path variables will be passed to the controllers.
 * @static
 * @method getRoutePattern
 * @param {String} The URL path
 * @return {Object|null} An object containing three properties: The specified
 * "path". The generated regular expression "pattern" as a string. Lastly, a
 * hash of the path variables and their position in the path coorelating to its
 * depth in the path.
 */
RequestHandler.getRoutePattern = function(path) {
	if (!path) {
		return null;
	}

	//clean up path
	if (path.indexOf('/') == 0) {
		path = path.substring(1);
	}
	if (path.lastIndexOf('/') == path.length - 1) {
		path = path.substring(0, path.length - 1);
	}

	//construct the pattern & extract path variables
	var pathVars = {};
	var pattern = '^';
	var pathPieces = path.split('/');
	for (var i = 0; i < pathPieces.length; i++) {
		var piece = pathPieces[i];

		if (piece.indexOf(':') == 0) {
			var fieldName = piece.substring(1);
			pathVars[fieldName] = i + 1;
			pattern += '/[A-Za-z0-9_\-]+';
		}
		else {
			if (piece.indexOf('*') >= 0) {
				piece = piece.replace(/\*/g, '.*');
			}
			pattern += '/'+piece;
		}
	}
	pattern += '[/]{0,1}$';

	return {
		path: path,
		pattern: pattern,
		pathVars: pathVars
	};
};

/**
 * Processes a request:
 * <ol>
 * 	<li>Initialize localization</li>
 * 	<li>if Public Route:
 * 		<ol>
 * 			<li>If Valid Content
 * 				<ol><li>Serve Public Content</li></ol>
 * 			</li>
 * 			<li>Else Serve 404</li>
 * 		</ol>
 * 	</li>
 * 	<li>Else Parse Cookies</li>
 * 	<li>Open/Create a session</li>
 * 	<li>Get Route</li>
 * </ol>
 * @method handleRequest
 */
RequestHandler.prototype.handleRequest = function(){

	//get locale preference
	this.localizationService = new pb.Localization(this.req);

	//fist things first check for public resource
	if (RequestHandler.isPublicRoute(this.url.pathname)) {
		this.servePublicContent();
		return;
	}

	//check for session cookie
	var cookies = RequestHandler.parseCookies(this.req);
	this.req.headers[pb.SessionHandler.COOKIE_HEADER] = cookies;

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

/**
 * Serves up public content from an absolute file path
 * @method servePublicContent
 * @param {String} absolutePath An absolute file path to the resource
 */
RequestHandler.prototype.servePublicContent = function(absolutePath) {

	//check for provided path, then default if necessary
    if (absolutePath === undefined) {
		absolutePath = path.join(DOCUMENT_ROOT, 'public', this.url.pathname);
	}

	var self = this;
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
		var mime = RequestHandler.getMimeFromPath(absolutePath);
        if (mime) {
            data.content_type = mime;
        }

		//send response
		self.writeResponse(data);
	});
};

RequestHandler.getMimeFromPath = function(resourcePath) {
    var map = {
        js: 'text/javascript',
        css: 'text/css',
        png: 'image/png',
        svg: 'image/svg+xml',
        jpg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        ico: 'image/vnd.microsoft.icon',
        tff: 'application/octet-stream',
        eot: 'application/vnd.ms-fontobject',
        woff: 'application/x-font-woff',
        html: 'text/html'
    };
    var index = resourcePath.lastIndexOf('.');
    if (index >= 0) {
        return map[resourcePath.substring(index + 1)];
    }
    return undefined;
};

RequestHandler.isPublicRoute = function(path){
	var publicRoutes = ['/js/', '/css/', '/fonts/', '/img/', '/localization/', '/favicon.ico', '/docs/', '/bower_components/'];
	for (var i = 0; i < publicRoutes.length; i++) {
		if (path.indexOf(publicRoutes[i]) == 0) {
			return true;
		}
	}
	return false;
};

RequestHandler.prototype.serve404 = function() {

	var NotFound  = require('../../controllers/error/404.js');
	var cInstance = new NotFound();
	this.doRender({}, cInstance);

	if (pb.log.isSilly()) {
		pb.log.silly("RequestHandler: No Route Found, Sending 404 for URL="+this.url.href);
	}
};

/**
 * TODO Church this up a bit.  Make it a template and controller like 404.
 * TODO install an encoder entity since node prints out function names in angle brackets
 */
RequestHandler.prototype.serveError = function(err) {
    if (this.resp.headerSent) {
        return false;
    }
    
	var data = {
		content: '<html><body><h2>Whoops! Something unexpected happened.</h2><br/><pre>'+(err ? err.stack : err)+'</pre></body></html>',
		content_type: 'text/html',
		code: 500
	};
	this.onRenderComplete(data);
    return true;
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
	pb.settings.get('active_theme', function(err, activeTheme){
		if (!activeTheme) {
			pb.log.warn("RequestHandler: The active theme is not set.  Defaulting to '%s'", RequestHandler.DEFAULT_THEME);
			activeTheme = RequestHandler.DEFAULT_THEME;
		}
		self.onThemeRetrieved(activeTheme, route);
	});
};

RequestHandler.prototype.getRoute = function(path) {

	var route = null;
	for (var i = 0; i < RequestHandler.storage.length; i++) {

		var curr   = RequestHandler.storage[i];
		var result = curr.expression.test(path);

		if (pb.log.isSilly()) {
			pb.log.silly('RequestHandler: Comparing Path [%s] to Pattern [%s] Result [%s]', path, curr.pattern, result);
		}
		if (result) {
			route = curr;
			break;
		}
	}
	return route;
};

RequestHandler.routeSupportsMethod = function(themeRoutes, method) {
    method = method.toUpperCase();
    return themeRoutes[method] !== undefined;
};

RequestHandler.routeSupportsTheme = function(route, theme, method) {
    return route.themes[theme] !== undefined && RequestHandler.routeSupportsMethod(route.themes[theme], method);
};

RequestHandler.prototype.getRouteTheme = function(activeTheme, route) {
    var obj = {theme: null, method: null};

    var methods = [this.req.method, 'ALL'];
    for (var i = 0; i < methods.length; i++) {

        //check for themed route
        var themesToCheck = [activeTheme, RequestHandler.DEFAULT_THEME];
        pb.utils.arrayPushAll(Object.keys(route.themes), themesToCheck);
        for (var j = 0; j < themesToCheck.length; j++) {

            //see if theme supports method and provides support
            if (RequestHandler.routeSupportsTheme(route, themesToCheck[j], methods[i])) {
                obj.theme  = themesToCheck[j];
                obj.method = methods[i];
                return obj;
            }
        }
    }
    return obj;
}

RequestHandler.prototype.onThemeRetrieved = function(activeTheme, route) {
	var self = this;

	//check for unregistered route for theme
	var rt = this.getRouteTheme(activeTheme, route);

	if (pb.log.isSilly()) {
		pb.log.silly("RequestHandler: Settling on theme [%s] and method [%s] for URL=[%s:%s]", rt.theme, rt.method, this.req.method, this.url.href);
	}

	//sanity check
	if (rt.theme === null || rt.method === null) {
		this.serve404();
		return;
	}

	//do security checks
	this.checkSecurity(rt.theme, rt.method, function(err, result) {
		if (pb.log.isSilly()) {
			pb.log.silly("RequestHandler: Security Result=[%s]", result.success);
			for (var key in result.results) {
				pb.log.silly("RequestHandler:"+key+': '+JSON.stringify(result.results[key]));
			}
		}
		//all good
		if (result.success) {
			self.onSecurityChecksPassed(rt.theme, rt.method, route);
			return;
		}

		//handle failures through bypassing other processing and doing output
		self.onRenderComplete(err);
	});
};

RequestHandler.prototype.onSecurityChecksPassed = function(activeTheme, method, route) {

	//extract path variables
	var pathVars = {};
	var pathParts = this.url.pathname.split('/');
	for (var field in route.path_vars) {
		pathVars[field] = pathParts[route.path_vars[field]];
	}

	//execute controller
	var ControllerType  = route.themes[activeTheme][method].controller;
	var cInstance       = new ControllerType();
	this.doRender(pathVars, cInstance);
};

RequestHandler.prototype.doRender = function(pathVars, cInstance) {
	var self  = this;
	var props = {
	    request_handler: this,
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

RequestHandler.prototype.checkSecurity = function(activeTheme, method, cb){
	var self        = this;
	this.themeRoute = this.route.themes[activeTheme][method];

	//verify if setup is needed
	var checkSystemSetup = function(callback) {
		var result = {success: true};
		if (self.themeRoute.setup_required == undefined || self.themeRoute.setup_required == true) {
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
		if (self.themeRoute.auth_required == true) {

			if (self.session.authentication.user_id == null || self.session.authentication.user_id == undefined) {
				result.success  = false;
				result.redirect = RequestHandler.isAdminURL(self.url.href) ? '/admin/login' : '/user/login';
				self.session.on_login = self.req.method.toLowerCase() === 'get' ? self.url.href : pb.UrlService.urlJoin(pb.config.siteRoot, '/admin');
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
		if (self.themeRoute.access_level !== undefined) {

			if (self.session.authentication.admin_level < self.themeRoute.access_level) {
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

	var checkPermissions = function(callback) {

		var result   = {success: true};
		var reqPerms = self.themeRoute.permissions;
		var auth     = self.session.authentication;
		if (auth && auth.user && auth.access_level !== ACCESS_ADMINISTRATOR && auth.user.permissisions && util.isArray(reqPerms)) {

			var permMap = self.session.authentication.user.permissions;
			for(var i = 0; i < reqPerms.length; i++) {

				if (!permMap[reqPerms[i]]) {
					result.success = false;
					result.content = '403 Forbidden';
					result.code    = 403;
					callback(result, result);
					return;
				}
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
        checkAdminLevel: checkAdminLevel,
        checkPermissions: checkPermissions
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
    var d = domain.create();
    d.add(controller);
    d.run(function() {
        process.nextTick(function() {
            controller.render(function(result){
                self.onRenderComplete(result);
            });
        });
	});
    d.on('error', function(err) {
        pb.log.error("RequestHandler: An error occurred during controller execution. URL=[%s:%s] ROUTE=%s\n%s", self.req.method, self.req.url, JSON.stringify(self.route), err.stack);
        self.serveError(err);
    });
};

RequestHandler.prototype.onRenderComplete = function(data){

	//set cookie
    var cookies = new Cookies(this.req, this.resp);
    if (this.setSessionCookie) {
    	try{
    		cookies.set(pb.SessionHandler.COOKIE_NAME, this.session.uid, pb.SessionHandler.getSessionCookie(this.session));
    	}
    	catch(e){
    		pb.log.error('RequestHandler: %s', e.stack);
    	}
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
		pb.log.debug("Response Time: "+(new Date().getTime() - this.startTime)+
				"ms URL=["+this.req.method+']'+
				this.req.url+(doRedirect ? ' Redirect='+data.redirect : '') +
				(data.code == undefined ? '' : ' CODE='+data.code));
	}

	//close session after data sent
	//public content doesn't require a session so in order to not error out we
	//check if the session exists first.
	if (this.session) {
		pb.session.close(this.session, function(err, result) {
			//TODO handle any errors
		});
	}
};

RequestHandler.prototype.writeResponse = function(data){

    //infer a response code when not provided
    if(typeof data.code === 'undefined'){
        data.code = 200;
    }

    // If a response code other than 200 is provided, force that code into the head
    var contentType = 'text/html';
    if (typeof data.content_type !== 'undefined') {
    	contentType = data.content_type;
    }
    else if (this.themeRoute && this.themeRoute.content_type != undefined) {
    	contentType = this.themeRoute.content_type;
    }

    //send response
    //the catch allows us to prevent any plugins that callback trwice from
    //screwing us over due to the attempt to write headers twice.
    try {
    	//set any custom headers
    	if (pb.utils.isObject(data.headers)) {
    		for(var header in data.headers) {
    			this.resp.setHeader(header, data.headers[header]);
    		}
    	}
        if (pb.config.server.x_powered_by) {
            this.resp.setHeader('x-powered-by', pb.config.server.x_powered_by);
        }
    	this.resp.setHeader('content-type', contentType);
    	this.resp.writeHead(data.code);
    	this.resp.end(data.content);
    }
    catch(e) {
    	pb.log.error('RequestHandler: '+e.stack);
    }
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

RequestHandler.urlExists = function(url, id, cb) {
	var dao = new pb.DAO();
	var getTask = function(collection) {
		return function (callback) {
			var where = {url: url};
			if (id) {
				where._id = {$ne: new ObjectID(id)};
			}
			dao.count(collection, where, function(err, count) {
                if(util.isError(err) || count > 0) {
                    callback(true, count);
                }
                else {
                	callback(null, count);
                }
			});
		};
	};
	async.series([getTask('article'), getTask('page')], function(err, results){
		cb(err, err != null);
	});
};

RequestHandler.isAdminURL = function(url) {
	if (url != null) {

		var index = url.indexOf('/');
		if (index == 0 && url.length > 0) {
			url = url.substring(1);
		}

		var pieces = url.split('/');
		return pieces.length > 0 && pieces[0].indexOf('admin') == 0;
	}
	return false;
};

RequestHandler.isSystemSafeURL = function(url, id, cb) {
	if (url == null || RequestHandler.isAdminURL(url)) {
		cb(null, false);
		return;
	}
	RequestHandler.urlExists(url, id, function(err, exists){
		cb(err, !exists);
	});
};

//exports
module.exports.RequestHandler = RequestHandler;
