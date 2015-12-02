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
var url     = require('url');
var fs      = require('fs');
var path    = require('path');
var process = require('process');
var async   = require('async');
var domain  = require('domain');
var Cookies = require('cookies');
var util    = require('../util.js');
var _ = require('lodash');

module.exports = function RequestHandlerModule(pb) {

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
        this.hostname  = req.headers.host;
        this.activeTheme = null;
        this.errorCount = 0;
    }

    /**
     * A mapping that provides the interface type to parse the body based on the
     * route specification
     * @private
     * @static
     * @readonly
     * @property BODY_PARSER_MAP
     * @type {Object}
     */
    var BODY_PARSER_MAP = {
        'application/json': pb.JsonBodyParser,
        'application/x-www-form-urlencoded': pb.FormBodyParser,
        'multipart/form-data': pb.FormBodyParser
    };

    /**
     * The fallback theme (pencilblue)
     * @static
     * @property DEFAULT_THEME
     * @type {String}
     */
    RequestHandler.DEFAULT_THEME = pb.config.plugins.default;

    /**
     * The internal storage of routes after they are validated and processed.
     * @private
     * @static
     * @property storage
     * @type {Array}
     */
    RequestHandler.storage = [];
    RequestHandler.index   = {};
    RequestHandler.sites = {};
    var GLOBAL_SITE = pb.SiteService.GLOBAL_SITE;
    /**
     * The internal storage of static routes after they are validated and processed.
     * @private
     * @static
     * @property staticRoutes
     * @type {Object}
     */
    RequestHandler.staticRoutes = {};

    /**
     * The list of routes provided by the pencilblue plugin.  These routes are
     * loaded first to ensure defaults are in place before other plugins are
     * initialized.  In the future this will change so that all plugins are treated
     * equally.
     * @private
     * @static
     * @property CORE_ROUTES
     * @type {Array}
     */
    RequestHandler.CORE_ROUTES = require(path.join(pb.config.docRoot, '/plugins/pencilblue/include/routes.js'))(pb);

    /**
     * Initializes the request handler prototype by registering the core routes for
     * the system.  This should only be called once at startup.
     * @static
     * @method init
     */
    RequestHandler.init = function(){

        //iterate core routes adding them
        pb.log.debug('RequestHandler: Registering System Routes');
        util.forEach(RequestHandler.CORE_ROUTES, function(descriptor) {

            //register the route
            try {
                var result = RequestHandler.registerRoute(descriptor, RequestHandler.DEFAULT_THEME);
                if (!result) {
                    throw new Error();
                }
            }
            catch(e) {
                pb.log.error('RequestHandler: Failed to register PB route: %s %s', descriptor.method, descriptor.path);
                pb.log.silly(e.stack);
            }
        });
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
     * @static
     * @method loadSite
     * @param {Object} site
     */
    RequestHandler.loadSite = function(site) {
        RequestHandler.sites[site.hostname] = { active: site.active, uid: site.uid, displayName: site.displayName, hostname: site.hostname };
    };

    /**
     * @static
     * @method activateSite
     * @param {Object} site
     */
    RequestHandler.activateSite = function(site) {
        RequestHandler.sites[site.hostname].active = true;
    };

    /**
     * @static
     * @method deactivateSite
     * @param {Object} site
     */
    RequestHandler.deactivateSite = function(site) {
        RequestHandler.sites[site.hostname].active = false;
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
            !util.isNullOrUndefined(descriptor.path);
    };

    /**
     * Unregisters all routes associated with a theme
     * @static
     * @method unregisterThemeRoutes
     * @param {String} theme The plugin/theme uid
     * @return {Integer} The number of routes removed
     */
    RequestHandler.unregisterThemeRoutes = function(theme, site) {
        //resolve the site
        if(!site)
        {
            site = GLOBAL_SITE;
        }

        var routesRemoved = 0;

        //pattern routes
        for (var i = 0; i < RequestHandler.storage.length; i++) {
            var path   = RequestHandler.storage[i].path;
            var result = RequestHandler.unregisterRoute(path, theme, site);
            if (result) {
                routesRemoved++;
            }
        }

        //static routes
        Object.keys(RequestHandler.staticRoutes).forEach(function(path) {
            var result = RequestHandler.unregisterRoute(path, theme, site);
            if (result) {
                routesRemoved++;
            }
        });
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
    RequestHandler.unregisterRoute = function(path, theme, site) {
        //resolve the site
        if(!site)
        {
            site = GLOBAL_SITE;
        }


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
        var descriptor;
        if (RequestHandler.staticRoutes[path]) {
            descriptor = RequestHandler.staticRoutes[path];
        }
        else if (RequestHandler.index[pattern]) {
            descriptor = RequestHandler.storage[RequestHandler.index[pattern]];
        }
        else {
            //not a static route or pattern route
            return false;
        }

        //return false if specified site has no themes registered on that descriptor
        //return false if theme doesnt exist on descriptor for that site
        if (!descriptor || !descriptor.themes[site] || !descriptor.themes[site][theme]) {
            return false;
        }

        //remove from service
        delete descriptor.themes[site][theme];
        descriptor.themes[site].size--;
        if(descriptor.themes[site].size < 1) {
            delete descriptor.themes[site];
        }
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
     * @param {String} [descriptor.content_type='text/html'] The content type header sent with the response
     * @param {String} theme The plugin/theme UID
     * @return {Boolean} TRUE if the route was registered, FALSE if not
     */
    RequestHandler.registerRoute = function(descriptor, theme, site){
        //resolve empty site to global
        if(!site)
        {
            site = GLOBAL_SITE;
        }

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
        var isStatic   = Object.keys(pathVars).length === 0 && !patternObj.hasWildcard;

        //insert it
        var isNew = false;
        var routeDescriptor = null;
        if (isStatic && !util.isNullOrUndefined(RequestHandler.staticRoutes[descriptor.path])) {
            routeDescriptor = RequestHandler.staticRoutes[descriptor.path];
        }
        else if (!isStatic && !util.isNullOrUndefined(RequestHandler.index[pattern])) {

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
            isNew = true;
            routeDescriptor = {
                path: patternObj.path,
                pattern: pattern,
                path_vars: pathVars,
                expression: new RegExp(pattern),
                themes: {}
            };
        }

        //if the site has no themes on this route, add it
        if(!routeDescriptor.themes[site])
        {
            routeDescriptor.themes[site] = {};
            routeDescriptor.themes[site].size = 0;
        }

        //set the descriptor for the theme and load the controller type
        if (!routeDescriptor.themes[site][theme]) {
            routeDescriptor.themes[site][theme] = {};
            routeDescriptor.themes[site].size++;
        }
        routeDescriptor.themes[site][theme][descriptor.method]            = descriptor;
        routeDescriptor.themes[site][theme][descriptor.method].controller = require(descriptor.controller)(pb);

       //only add the descriptor it is new.  We do it here because we need to
       //know that the controller is good.
        if (isNew) {
            //set them in storage
            if (isStatic) {
                RequestHandler.staticRoutes[descriptor.path] = routeDescriptor;
            }
            else {
                RequestHandler.index[pattern] = RequestHandler.storage.length;
                RequestHandler.storage.push(routeDescriptor);
            }
        }

        //log the result
        if (isStatic) {
            pb.log.debug('RequestHander: Registered Static Route - Theme [%s] Path [%s][%s]', theme, descriptor.method, descriptor.path);
        }
        else {
            pb.log.debug('RequestHandler: Registered Route - Theme [%s] Path [%s][%s] Pattern [%s]', theme, descriptor.method, descriptor.path, pattern);
        }
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
        var pathVars    = {};
        var pattern     = '^';
        var hasWildcard = false;
        var pathPieces  = path.split('/');
        for (var i = 0; i < pathPieces.length; i++) {
            var piece = pathPieces[i];

            if (piece.indexOf(':') == 0) {
                var fieldName = piece.substring(1);
                pathVars[fieldName] = i + 1;
                pattern += '\/[^/]+';
            }
            else {
                if (piece.indexOf('*') >= 0) {
                    piece = piece.replace(/\*/g, '.*');

                    hasWildcard = true;
                }
                pattern += '\/'+piece;
            }
        }
        pattern += '[/]{0,1}$';

        return {
            path: path,
            pattern: pattern,
            pathVars: pathVars,
            hasWildcard: hasWildcard
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

        //fist things first check for public resource
        if (RequestHandler.isPublicRoute(this.url.pathname)) {
            return this.servePublicContent();
        }

        //check for session cookie
        var cookies = RequestHandler.parseCookies(this.req);
        this.req.headers[pb.SessionHandler.COOKIE_HEADER] = cookies;

        //open session
        var self = this;
        pb.session.open(this.req, function(err, session){
            if (util.isError(err)) {
                return self.serveError(err);
            }

            //get locale preference
            self.localizationService = self.deriveLocalization(session);

            //set the session id when no session has started or the current one has
            //expired.
            var sc = Object.keys(cookies).length == 0;
            var se = !sc && cookies.session_id != session.uid;
            self.setSessionCookie =  sc || se;
            if (pb.log.isSilly()) {
                pb.log.silly("RequestHandler: Session ID [%s] Cookie SID [%s] Created [%s] Expired [%s]", session.uid, cookies.session_id, sc, se);
            }

            //continue processing
            self.onSessionRetrieved(err, session);
        });
    };

    /**
     * Derives the locale and localization instance.
     * @method deriveLocalization
     */
    RequestHandler.prototype.deriveLocalization = function(session) {

        var userPreferredLocale = session.locale;
        var browserIndicated = this.req.headers[pb.Localization.ACCEPT_LANG_HEADER];
        if (browserIndicated) {
            browserIndicated = ',' + browserIndicated;
        }

        //get locale preference
        return new pb.Localization(userPreferredLocale + '' + browserIndicated);
    };

    /**
     * Serves up public content from an absolute file path
     * @method servePublicContent
     * @param {String} absolutePath An absolute file path to the resource
     */
    RequestHandler.prototype.servePublicContent = function(absolutePath) {

        //check for provided path, then default if necessary
        if (util.isNullOrUndefined(absolutePath)) {
            absolutePath = path.join(pb.config.docRoot, 'public', this.url.pathname);
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

    /**
     * Attempts to derive the MIME type for a resource path based on the extension
     * of the path.
     * @static
     * @method getMimeFromPath
     * @param {resourcePath} The file path to a resource
     * @return {String} The MIME type or NULL if could not be derived.
     */
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
            otf: 'font/opentype',
            ttf: 'font/truetype',
            pdf: 'application/pdf',
            html: 'text/html'
        };
        var index = resourcePath.lastIndexOf('.');
        if (index >= 0) {
            return map[resourcePath.substring(index + 1)];
        }
        return undefined;
    };

    /**
     * Determines if the path is mapped to static resources
     * @static
     * @method isPublicRoute
     * @param {String} path URL path to a resource
     * @return {Boolean} TRUE if mapped to a public resource directory, FALSE if not
     */
    RequestHandler.isPublicRoute = function(path){
        var publicRoutes = ['/js/', '/css/', '/fonts/', '/img/', '/localization/', '/favicon.ico', '/docs/', '/bower_components/'];
        for (var i = 0; i < publicRoutes.length; i++) {
            if (path.indexOf(publicRoutes[i]) == 0) {
                return true;
            }
        }
        return false;
    };

    /**
     * Serves up a 404 page when the path specified by the incoming request does
     * not exist. This function <b>WILL</b> close the connection.
     * @method serve404
     */
    RequestHandler.prototype.serve404 = function() {
        var error = new Error('NOT FOUND');
        error.code = 404;
        this.serveError(error);
        if (pb.log.isSilly()) {
            pb.log.silly("RequestHandler: No Route Found, Sending 404 for URL="+this.url.href);
        }
    };

    /**
     * Serves up an error page.  The page is responsible for displaying an error page
     * TODO Church this up a bit.  Make it a template and controller like 404.
     * TODO install an encoder entity since node prints out function names in angle brackets
     * @method serveError
     * @param {Error} err The failure that was generated by the executed controller
     * @return {Boolean} TRUE when the error is rendered, FALSE if the request had already been handled
     */
    RequestHandler.prototype.serveError = function(err) {
        if (this.resp.headerSent) {
            return false;
        }

        //bump the error count so handlers will no if we are recursively trying to handle errors.
        this.errorCount++;

        //retrieve the active theme.  Sometimes we don't have it such as in the case of the 404.
        var self = this;
        var getActiveTheme = function(cb){
            if (self.activeTheme) {
                return cb(null, self.activeTheme);
            }

            var settingsService = pb.SettingServiceFactory.getService(pb.config.settings.use_memory, pb.config.settings.use_cache, self.siteObj.uid);
            settingsService.get('active_theme', function(err, activeTheme){
                self.activeTheme = activeTheme;
                cb(null, activeTheme);
            });
        };

        getActiveTheme(function(error, activeTheme) {

            //build out params for handlers
            var params = {
                mime: self.themeRoute && self.themeRoute.content_type ? self.themeRoute.content_type : 'text/html',
                error: err,
                request: self.req,
                localization: self.localization,
                activeTheme: activeTheme,
                reqHandler: self,
                errorCount: self.errorCount
            };

            //hand off to the formatters.  NOTE: the callback may not be called if
            //the handler chooses to fire off a controller.
            pb.ErrorFormatters.formatForMime(params, function(error, result) {
                if (util.isError(error)) {
                    pb.log.error('RequestHandler: An error occurred attempting to render an error: %s', error.stack);
                }

                var data = {
                    reqHandler: self,
                    content: result.content,
                    content_type: result.mime,
                    code: err.code || 500
                };
                self.onRenderComplete(data);
            });
        });

        return true;
    };

    /**
     * Called when the session has been retrieved.  Responsible for checking the
     * active theme.  It then retrieves the route object and passes it off to onThemeRetrieved.
     * @method onSessionRetrieved
     * @param {Error} err Any error that occurred while retrieving the session
     * @param {Object} session The session for the requesting entity
     */
    RequestHandler.prototype.onSessionRetrieved = function(err, session) {
        if (err) {
            this.onErrorOccurred(err);
            return;
        }

        //set the session
        this.session = session;

        //set the site
        this.siteObj = RequestHandler.sites[this.hostname];

        if (!this.siteObj) {
            var hostnameErr = new Error("The host (" + this.hostname + ") has not been registered with a site. In single site mode, you must use your site root (" + pb.config.siteRoot + ").");
            pb.log.error(hostnameErr);
            this.serveError(hostnameErr);
            return;
        }

        this.site = this.siteObj.uid;
        this.siteName = this.siteObj.displayName;
        //find the controller to hand off to
        var route = this.getRoute(this.url.pathname);
        if (route == null) {
            this.serve404();
            return;
        }
        this.route = route;

        //get active theme
        var self = this;
        var settings = pb.SettingServiceFactory.getService(pb.config.settings.use_memory, pb.config.settings.use_cache, this.siteObj.uid);
        settings.get('active_theme', function(err, activeTheme){
            if (!activeTheme) {
                pb.log.warn("RequestHandler: The active theme is not set.  Defaulting to '%s'", RequestHandler.DEFAULT_THEME);
                activeTheme = RequestHandler.DEFAULT_THEME;
            }

            self.activeTheme = activeTheme;
            self.onThemeRetrieved(activeTheme, route);
        });
    };

    /**
     * Compares the path against the registered routes's to lookup the route object.
     * @method getRoute
     * @param {String} path The URL path for the incoming request
     * @return {Object} The route object or NULL if the path does not match any route
     */
    RequestHandler.prototype.getRoute = function(path) {

        //check static routes first.  It must be an exact match including
        //casing and any ending slash.
        var isSilly = pb.log.isSilly();
        var route   = RequestHandler.staticRoutes[path];
        if (!util.isNullOrUndefined(route)) {
            if(route.themes[this.siteObj.uid] || route.themes[GLOBAL_SITE]) {
                if (isSilly) {
                    pb.log.silly('RequestHandler: Found static route [%s]', path);
                }
                return route;
            }
        }

        //now do the hard work.  Iterate over the available patterns until a
        //pattern is found.
        for (var i = 0; i < RequestHandler.storage.length; i++) {

            var curr   = RequestHandler.storage[i];
            var result = curr.expression.test(path);

            if (isSilly) {
                pb.log.silly('RequestHandler: Comparing Path [%s] to Pattern [%s] Result [%s]', path, curr.pattern, result);
            }
            if (result) {
                if(curr.themes[this.siteObj.uid] || curr.themes[GLOBAL_SITE]) {
                    return curr;
                }
                break;
            }
        }

        //ensures we return null when route is not found for backward
        //compatibility.
        return null;
    };

    /**
     * Determines if the route supports the given HTTP method
     * @static
     * @method routeSupportsMethod
     * @param {Object} themeRoutes The route object that contains the specifics for
     * the theme variation of the route.
     * @param {String} method HTTP method
     */
    RequestHandler.routeSupportsMethod = function(themeRoutes, method) {
        method = method.toUpperCase();
        return !util.isNullOrUndefined(themeRoutes[method]);
    };

    /**
     * Determines if a route supports a particular theme and HTTP method
     * @static
     * @method routeSupportsTheme
     * @param {Object} route
     * @param {String} theme The theme
     * @param {String} method HTTP method
     * @param {string} site current site
     * @return {Boolean}
     */
    RequestHandler.routeSupportsSiteTheme = function(route, theme, method, site) {
        return !util.isNullOrUndefined(route.themes[site]) &&
            !util.isNullOrUndefined(route.themes[site][theme]) &&
            RequestHandler.routeSupportsMethod(route.themes[site][theme], method);
    };

    /**
     * @static
     * @method routeSupportsGlobalTheme
     * @param {Object} route
     * @param {String} theme
     * @param {String} method
     */
    RequestHandler.routeSupportsGlobalTheme = function(route, theme, method) {
        return RequestHandler.routeSupportsSiteTheme(route, theme, method, GLOBAL_SITE);
    };

    /**
     * Determines the theme that will be executed for the route.
     * The themes will be prioritized as: active theme, pencilblue, followed by
     * iterating over all other inherited themes.
     * @method getRouteTheme
     * @param {String} activeTheme
     * @param {Object} route
     * @return {Object} An object with two properties: theme and method
     */
    RequestHandler.prototype.getRouteTheme = function(activeTheme, route) {
        var obj = {theme: null, method: null, site: null};

        var methods = [this.req.method, 'ALL'];
        for (var i = 0; i < methods.length; i++) {

            //check for themed route
            var themesToCheck = [activeTheme, RequestHandler.DEFAULT_THEME];
            if (this.siteObj.uid in route.themes) {
                util.arrayPushAll(Object.keys(route.themes[this.siteObj.uid]), themesToCheck);
            }
            if (!pb.SiteService.isGlobal(this.siteObj.uid) && (pb.SiteService.GLOBAL_SITE in route.themes)) {
                util.arrayPushAll(Object.keys(route.themes[pb.SiteService.GLOBAL_SITE]), themesToCheck);
            }
            themesToCheck = _.uniq(themesToCheck);
            for (var j = 0; j < themesToCheck.length; j++) {

                //see if theme supports method and provides support
                if (RequestHandler.routeSupportsSiteTheme(route, themesToCheck[j], methods[i], this.siteObj.uid)) {
                    obj.theme  = themesToCheck[j];
                    obj.method = methods[i];
                    obj.site   = this.siteObj.uid;
                    return obj;
                } else if (RequestHandler.routeSupportsGlobalTheme(route, themesToCheck[j], methods[i])) {
                    obj.theme  = themesToCheck[j];
                    obj.method = methods[i];
                    obj.site   = GLOBAL_SITE;
                    return obj;
                }
            }
        }
        return obj;
    }

    /**
     *
     * @method onThemeRetrieved
     * @param {String} activeTheme
     * @param {Object} route
     */
    RequestHandler.prototype.onThemeRetrieved = function(activeTheme, route) {
        var self = this;

        //check for unregistered route for theme
        var rt = this.routeTheme = this.getRouteTheme(activeTheme, route);

        if (pb.log.isSilly()) {
            pb.log.silly("RequestHandler: Settling on theme [%s] and method [%s] for URL=[%s:%s]", rt.theme, rt.method, this.req.method, this.url.href);
        }

        //sanity check
        if (rt.theme === null || rt.method === null || rt.site === null) {
            this.serve404();
            return;
        }

        var inactiveSiteAccess = route.themes[rt.site][rt.theme][rt.method].inactive_site_access;
        if (!this.siteObj.active && !inactiveSiteAccess) {
            if (this.siteObj.uid === pb.SiteService.GLOBAL_SITE) {
                this.doRedirect('/admin');
                return;
            }
            else {
                this.serve404();
                return;
            }
        }

        //do security checks
        this.checkSecurity(rt.theme, rt.method, rt.site, function(err, result) {
            if (pb.log.isSilly()) {
                pb.log.silly('RequestHandler: Security Result=[%s]', result.success);
                for (var key in result.results) {
                    pb.log.silly('RequestHandler:%s: %s', key, JSON.stringify(result.results[key]));
                }
            }
            //all good
            if (result.success) {
                return self.onSecurityChecksPassed(activeTheme, rt.theme, rt.method, rt.site, route);
            }

            //handle failures through bypassing other processing and doing output
            self.onRenderComplete(err);
        });
    };

    /**
     *
     * @method onSecurityChecksPassed
     * @param {String} activeTheme The user set active theme
     * @param {String} routeTheme The plugin/theme who's controller will handle the request
     * @param {String} method
     * @param {String} site
     * @param {Object} route
     */
    RequestHandler.prototype.onSecurityChecksPassed = function(activeTheme, routeTheme, method, site, route) {

        //extract path variables
        var pathVars = this.getPathVariables(route);

        //instantiate controller
        var ControllerType  = route.themes[site][routeTheme][method].controller;
        var cInstance       = new ControllerType();

        //execute it
        var context = {
            pathVars: pathVars,
            cInstance: cInstance,
            themeRoute: route.themes[site][routeTheme][method],
            activeTheme: activeTheme
        };
        this.doRender(context);
    };

    /**
     *
     * @method getPathVariables
     * @param {Object} route
     * @param {Object} route.path_vars
     */
    RequestHandler.prototype.getPathVariables = function(route) {
        var pathVars = {};
        var pathParts = this.url.pathname.split('/');
        for (var field in route.path_vars) {
            pathVars[field] = pathParts[route.path_vars[field]];
        }
        return pathVars;
    };

    /**
     * Begins the rendering process by initializing the controller.  This is done
     * by gathering all initialization parameters and calling the controller's
     * "init" function.
     * @method doRender
     * @param {Object} pathVars The URL path's variables
     * @param {BaseController} cInstance An instance of the controller to be executed
     * @param {Object} themeRoute
     * @param {String} activeTheme The user set active theme
     */
    RequestHandler.prototype.doRender = function(context) {
        var self  = this;

        //attempt to parse body
        this.parseBody(context.themeRoute.request_body, function(err, body) {
            if (util.isError(err)) {
                err.code = 400;
                return self.serveError(err);
            }

            //build out properties & merge in any that are special to this call
            var props = {
                request_handler: self,
                request: self.req,
                response: self.resp,
                session: self.session,
                localization_service: self.localizationService,
                path_vars: context.pathVars,
                pathVars: context.pathVars,
                query: self.url.query,
                body: body,
                site: self.site,
                siteObj: self.siteObj,
                siteName: self.siteName,
                activeTheme: context.activeTheme || self.activeTheme
            };
            if (util.isObject(context.initParams)) {
                util.merge(context.initParams, props);
            }

            //initialize the controller
            context.cInstance.init(props, function(){
                self.onControllerInitialized(context.cInstance, context.themeRoute);
            });
        });
    };

    /**
     * Parses the incoming request body when the body type specified matches one of
     * those explicitly allowed by the rotue.
     * @method parseBody
     * @param {Array} mimes An array of allowed MIME strings.
     * @param {Function} cb A callback that takes 2 parameters: An Error, if
     * occurred and the parsed body.  The parsed value is often an object but the
     * value is dependent on the parser selected by the content type.
     */
    RequestHandler.prototype.parseBody = function(mimes, cb) {

        //we don't force a mime.  Controllers have the ability to handle this
        //themselves.
        if (!util.isArray(mimes)) {
            return cb(null, null);
        }

        //verify that the content type is acceptable
        var contentType = this.req.headers['content-type'];
        if (contentType) {

            //we split on ';' to check for multipart encoding since it specifies a
            //boundary
            contentType = contentType.split(';')[0];
            if (mimes.indexOf(contentType) === -1) {
                //a type was specified but its not accepted by the controller
                //TODO return HTTP 415
                return cb(null, null);
            }
        }

        //create the parser
        var BodyParser = BODY_PARSER_MAP[contentType];
        if (!BodyParser) {
            pb.log.silly('RequestHandler: no handler was found to parse the body type [%s]', contentType);
            return cb(null, null);
        }

        //execute the parsing
        var self = this;
        var d = domain.create();
        d.on('error', cb);
        d.run(function() {
            process.nextTick(function() {

                //initialize the parser and parse content
                var parser = new BodyParser();
                parser.parse(self.req, cb);
            });
        });
    };

    /**
     *
     * @method onControllerInitialized
     * @param {BaseController} controller
     */
    RequestHandler.prototype.onControllerInitialized = function(controller, themeRoute) {
        var self = this;
        var d = domain.create();
        d.add(controller);
        d.run(function() {
            process.nextTick(function() {
                controller[themeRoute.handler ? themeRoute.handler : 'render'](function(result){
                    self.onRenderComplete(result);
                });
            });
        });
        d.on('error', function(err) {
            pb.log.error("RequestHandler: An error occurred during controller execution. URL=[%s:%s] ROUTE=%s\n%s", self.req.method, self.req.url, JSON.stringify(self.route), err.stack);
            self.serveError(err);
        });
    };

    /**
     *
     * @method onRenderComplete
     * @param {Object} data
     */
    RequestHandler.prototype.onRenderComplete = function(data){
        if (util.isError(data)) {
            return this.serveError(data);
        }

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
            var self = this;
            pb.session.close(this.session, function(err, result) {
                if (util.isError(err)) {
                    pb.log.warn('RequestHandler: Failed to close session [%s]', self.session.uid);
                }
            });
        }
    };

    /**
     *
     * @method writeResponse
     * @param {Object} data
     */
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
            if (util.isObject(data.headers)) {
                for(var header in data.headers) {
                    this.resp.setHeader(header, data.headers[header]);
                }
            }
            if (pb.config.server.x_powered_by) {
                this.resp.setHeader('x-powered-by', pb.config.server.x_powered_by);
            }
            this.resp.setHeader('content-type', contentType);
            this.resp.writeHead(data.code);

            //write content
            var content = data.content;
            if (Buffer.isBuffer(content)) {
                /* no op */
            }
            else if (util.isObject(data.content)) {
                content = JSON.stringify(content);
            }
            this.resp.end(content);
        }
        catch(e) {
            pb.log.error('RequestHandler: '+e.stack);
        }
    };

    /**
     * Creates a cookie string
     * @method writeCookie
     * @param {Object} descriptor The pieces of the cookie that are to be included
     * in the string.  These pieces are represented as key value pairs.  Each value
     * will be serialized via its implicity "toString" function.
     * @param {String} [cookieStr=''] The current cookie string if it exists
     * @return {String} The cookie represented as a string
     */
    RequestHandler.prototype.writeCookie = function(descriptor, cookieStr){
        cookieStr = cookieStr ? cookieStr : '';

        for(var key in descriptor) {
            cookieStr += key + '=' + descriptor[key]+'; ';
        }
        return cookieStr;
    };

    /**
     * Verifies that the incoming request meets all necessary security critiera
     * @method checkSecurity
     * @param {String} activeTheme
     * @param {String} method
     * @param {String} site
     * @param {Function} cb
     */
    RequestHandler.prototype.checkSecurity = function(activeTheme, method, site, cb){
        var self        = this;
        this.themeRoute = this.route.themes[site][activeTheme][method];

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
                    self.session.on_login = self.req.method.toLowerCase() === 'get' ? self.url.href : pb.UrlService.createSystemUrl('/admin', self.hostname);
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
            if (auth && auth.user &&
                auth.access_level !== pb.SecurityService.ACCESS_ADMINISTRATOR &&
                auth.user.permissisions &&
                util.isArray(reqPerms)) {

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

    /**
     *
     * @method doRedirect
     * @param {String} location
     */
    RequestHandler.prototype.doRedirect = function(location) {
        this.resp.statusCode = 302;
        this.resp.setHeader("Location", location);
        this.resp.end();
    };

    /**
     *
     * @method onErrorOccurred
     * @param {Error} err
     */
    RequestHandler.prototype.onErrorOccurred = function(err){
        var error = new PBError("Failed to open a session", 500);
        error.setSource(err);
        throw error;
    };

    /**
     *
     * @static
     * @method parseCookies
     * @param {Request} req
     * @return {Object}
     */
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

    /**
     *
     * @static
     * @method urlExists
     * @param {String} url
     * @param {
     */
    RequestHandler.urlExists = function(url, id, site, cb) {
        var dao = new pb.DAO();
        if(typeof site === 'function') {
            cb = site;
            site = undefined;
        }
        var getTask = function(collection) {
            return function (callback) {
                var where = {url: url};
                if(site) {
                    where.site = site;
                }
                if (id) {
                    where[pb.DAO.getIdField()] = pb.DAO.getNotIdField(id);
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

    /**
     *
     * @static
     * @method isAdminURL
     * @param {String} url
     */
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

    /**
     *
     * @static
     * @method isSystemSafeURL
     * @param {String} url
     * @param {String} id
     * @param {Function} cb
     */
    RequestHandler.isSystemSafeURL = function(url, id, site, cb) {
        if(typeof site === 'function') {
            cb = site;
            site = undefined;
        }
        if (url == null || RequestHandler.isAdminURL(url)) {
            cb(null, false);
            return;
        }
        RequestHandler.urlExists(url, id, site, function(err, exists){
            cb(err, !exists);
        });
    };

    /**
     * Registers a body parser prototype for the specified mime
     * @static
     * @method registerBodyParser
     * @param {String} mime A non empty string representing the mime type that the prototype can parse
     * @param {Function} prototype A prototype that can have an instance created and parse the specified mime type
     * @return {Boolean} TRUE if the body parser was registered, FALSE if not
     */
    RequestHandler.registerBodyParser = function(mime, prototype) {
        if (!pb.validation.isNonEmptyStr(mime, true) || !util.isFunction(prototype)) {
            return false;
        }

        //set the prototype handler
        BODY_PARSER_MAP[mime] = prototype;
        return true;
    };
    
    /**
     * Retrieves the body parser mapping
     * @static
     * @method getBodyParsers
     * @return {Object} MIME string as the key and parser as the value
     */
    RequestHandler.getBodyParsers = function() {
        return util.merge(BODY_PARSER_MAP, {});
    };

    return RequestHandler;
};
