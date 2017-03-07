/*
    Copyright (C) 2016  PencilBlue, LLC

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
'use strict';

//dependencies
const _ = require('lodash');
const async = require('async');
const AsyncEventEmitter = require('../utils/async_event_emitter');
const Configuration = require('../config');
const Cookies = require('cookies');
const domain  = require('domain');
const ErrorFormatters = require('../error/formatters/error_formatters');
const fs = require('fs');
const HttpStatusCodes = require('http-status-codes');
const Localization = require('../localization');
const log = require('../utils/logging').newInstance('RequestHandler');
const mime = require('mime');
const path = require('path');
const RouteService = require('../../lib/service/routeService');
const SecurityService = require('../access_management');
const SessionHandler = require('../session/session');
const SettingServiceFactory = require('../system/settings');
const SiteUtils = require('../../lib/utils/siteUtils');
const url = require('url');
const UrlUtils = require('../../lib/utils/urlUtils');

    /**
     * Responsible for processing a single req by delegating it to the correct controllers
     * @class RequestHandler
     * @extends AsyncEventEmitter
     * @constructor
     * @param {Server} server The http server that the request came in on
     * @param {Request} req The incoming request
     * @param {Response} res The outgoing response
     */
    function RequestHandler(server, req, res){

        /**
         * @property startTime
         * @type {number}
         */
        this.startTime = (new Date()).getTime();

        /**
         * @property server
         * @type {Server}
         */
        this.server = server;

        /**
         * @property req
         * @type {Request}
         */
        this.req = req;

        /**
         * @property resp
         * @type {Response}
         */
        this.resp = res;

        /**
         * @property url
         * @type {Url}
         */
        this.url = url.parse(req.url, true);

        /**
         * The hostname (host header) of the current request. When no host
         * header is provided the globa context is assumed.  We do this because
         * some load balancers including HAProxy use the root as the heartbeat.
         * If we error then the web server will be taken out of the server pool
         * resulting in a 503 from the load balancer
         * @property hostname
         * @type {String}
         */
        this.hostname  = req.headers.host || SiteUtils.getGlobalSiteContext().hostname;

        /**
         * @property activeTheme
         * @type {string}
         */
        this.activeTheme = null;

        /**
         * @property routeTheme
         * @type {object}
         */
        this.routeTheme = null;

        /**
         * @property errorCount
         * @type {number}
         */
        this.errorCount = 0;

        this.sessionHandler = new SessionHandler();
    }
    AsyncEventEmitter.extend(RequestHandler);

    /**
     * The fallback theme (pencilblue)
     * @static
     * @property DEFAULT_THEME
     * @type {String}
     */
    RequestHandler.DEFAULT_THEME = Configuration.active.plugins.default;

    RequestHandler.sites = {};
    RequestHandler.redirectHosts = {};
    var GLOBAL_SITE = SiteUtils.GLOBAL_SITE;

    /**
     * The event emitted when a route and theme is derived for an incoming request
     * @static
     * @readonly
     * @property THEME_ROUTE_RETRIEVED
     * @type {string}
     */
    RequestHandler.THEME_ROUTE_RETIEVED = 'themeRouteRetrieved';

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
        RequestHandler.sites[site.hostname] = {
          active: site.active,
          uid: site.uid,
          displayName: site.displayName,
          hostname: site.hostname,
          defaultLocale: site.defaultLocale,
          supportedLocales: site.supportedLocales,
          prevHostnames: site.prevHostnames
        };
        //Populate RequestHandler.redirectHosts if this site has prevHostnames associated
        if (site.prevHostnames) {
            site.prevHostnames.forEach(function (oldHostname) {
                RequestHandler.redirectHosts[oldHostname] = site.hostname;
            });
        }
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
     * Unregisters all routes associated with a theme
     * @static
     * @method unregisterThemeRoutes
     * @param {String} theme The plugin/theme uid
     * @param {string} site
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
            var pathStr = RequestHandler.storage[i].path;
            var result = RequestHandler.unregisterRoute(pathStr, theme, site);
            if (result) {
                routesRemoved++;
            }
        }

        //static routes
        Object.keys(RequestHandler.staticRoutes).forEach(function(pathStr) {
            var result = RequestHandler.unregisterRoute(pathStr, theme, site);
            if (result) {
                routesRemoved++;
            }
        });
        return routesRemoved;
    };

    /**
     * Derives the locale and localization instance.
     * TODO [1.0] Move to Localization service
     * @method deriveLocalization
     * @param {Object} context
     * @param {Object} [context.session]
     * @param {String} [context.routeLocalization]
     */
    RequestHandler.prototype.deriveLocalization = function(context) {
        var opts = {};

        var sources = [
            context.routeLocalization
        ];
        if (context.session) {
            sources.push(context.session.locale);
        }
        sources.push(this.req.headers[Localization.ACCEPT_LANG_HEADER]);
        if (this.siteObj) {
            opts.supported = Object.keys(this.siteObj.supportedLocales);
            sources.push(this.siteObj.defaultLocale);
        }
        var localePrefStr = sources.reduce(function(prev, curr, i) {
            return prev + (curr ? (!!i && !!prev ? ',' : '') + curr : '');
        }, '');

        //get locale preference
        return new Localization(localePrefStr, opts);
    };

    /**
     * Serves up public content from an absolute file path
     * @method servePublicContent
     * @param {String} [absolutePath] An absolute file path to the resource
     */
    RequestHandler.prototype.servePublicContent = function(absolutePath) {

        //check for provided path, then default if necessary
        if (_.isNil(absolutePath)) {
            absolutePath = path.join(Configuration.active.docRoot, 'public', this.url.pathname);
        }

        var self = this;
        fs.readFile(absolutePath, function(err, content){
            if (err) {

                //TODO [1.0] change default content type to JSON and refactor public file serving so it falls inline with other controller functions
                self.themeRoute = !!self.themeRoute ? Object.assign({}, self.themeRoute) : {};
                self.themeRoute.content_type = 'application/json';
                return self.serve404();
            }

            //build response structure
            //guess at content-type
            var data = {
                content: content,
                content_type: mime.lookup(absolutePath)
            };

            //send response
            self.writeResponse(data);
        });
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
        if (log.isSilly()) {
            log.silly("RequestHandler: No Route Found, Sending 404 for URL="+this.url.href);
        }
    };

    /**
     * Serves up an error page.  The page is responsible for displaying an error page
     * @method serveError
     * @param {Error} err The failure that was generated by the executed controller
     * @param {object} options
     * @return {Boolean} TRUE when the error is rendered, FALSE if the request had already been handled
     */
    RequestHandler.prototype.serveError = function(err, options) {
        if (this.resp.headerSent) {
            return false;
        }

        //default the options object
        options = options || {};

        //bump the error count so handlers will know if we are recursively trying to handle errors.
        this.errorCount++;

        //retrieve the active theme.  Sometimes we don't have it such as in the case of the 404.
        var self = this;
        var getActiveTheme = function(cb){
            if (self.activeTheme) {
                return cb(null, self.activeTheme);
            }

            self.siteObj = self.siteObj || SiteUtils.getGlobalSiteContext();
            var settingsService = SettingServiceFactory.getService(Configuration.active.settings.use_memory, Configuration.active.settings.use_cache, self.siteObj.uid);
            settingsService.get('active_theme', function(err, activeTheme){
                self.activeTheme = activeTheme || Configuration.active.plugins.default;
                cb(null, self.activeTheme);
            });
        };

        getActiveTheme(function(error, activeTheme) {

            //build out params for handlers
            self.localizationService = self.localizationService || self.deriveLocalization({});
            var params = {
                mime: self.themeRoute && self.themeRoute.content_type ? self.themeRoute.content_type : 'text/html',
                error: err,
                request: self.req,
                localization: self.localizationService,
                activeTheme: activeTheme,
                reqHandler: self,
                errorCount: self.errorCount
            };

            //hand off to the formatters.  NOTE: the callback may not be called if
            //the handler chooses to fire off a controller.
            var handler = options.handler || function(data) {
                self.onRenderComplete(data);
            };
            ErrorFormatters.formatForMime(params, function(error, result) {
                if (_.isError(error)) {
                    log.error('RequestHandler: An error occurred attempting to render an error: %s', error.stack);
                }

                var data = {
                    reqHandler: self,
                    content: result.content,
                    content_type: result.mime,
                    code: err.code || 500
                };
                handler(data);
            });
        });

        return true;
    };

    /**
     * Compares the path against the registered routes's to lookup the route object.
     * @method getRoute
     * @param {String} path The URL path for the incoming request
     * @return {Object} The route object or NULL if the path does not match any route
     */
    RequestHandler.prototype.getRoute = function(path) {
        return RouteService.getRoute(path, this.siteObj.uid);
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
        return !_.isNil(themeRoutes[method]);
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
        return !_.isNil(route.themes[site]) &&
            !_.isNil(route.themes[site][theme]) &&
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
                themesToCheck.push.apply(Object.keys(route.themes[this.siteObj.uid]));
            }
            if (!SiteUtils.isGlobal(this.siteObj.uid) && (SiteUtils.GLOBAL_SITE in route.themes)) {
                themesToCheck.push.apply(Object.keys(route.themes[SiteUtils.GLOBAL_SITE]));
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
    };

    /**
     * Emits the event to let listeners know that a request has derived the route and theme that matches the incoming
     * request
     * @method emitThemeRouteRetrieved
     * @param {function} cb
     */
    RequestHandler.prototype.emitThemeRouteRetrieved = function(cb) {
        var context = {
            site: this.site,
            themeRoute: this.routeTheme,
            requestHandler: this
        };
        RequestHandler.emit(RequestHandler.THEME_ROUTE_RETIEVED, context, cb);
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
        Object.keys(route.path_vars).forEach(function(field) {
            pathVars[field] = pathParts[route.path_vars[field]];
        });
        return pathVars;
    };

    /**
     *
     * @method onRenderComplete
     * @param {Error|object} data
     * @param {string} [data.redirect]
     * @param {Integer} [data.code
     */
    RequestHandler.prototype.onRenderComplete = function(data){
        if (_.isError(data)) {
            return this.serveError(data);
        }

        //set cookie
        var cookies = new Cookies(this.req, this.resp);
        if (this.setSessionCookie) {
            try{
                cookies.set(SessionHandler.COOKIE_NAME, this.session.uid, SessionHandler.getSessionCookie(this.session));
            }
            catch(e){
                log.error('RequestHandler: %s', e.stack);
            }
        }

        //do any necessary redirects
        var doRedirect = typeof data.redirect !== 'undefined';
        if(doRedirect) {
            this.doRedirect(data.redirect, data.statusCode);
        }
        else {
            //output data here
            this.writeResponse(data);
        }

        //calculate response time
        if (log.isDebug()) {
            log.debug("Response Time: "+(new Date().getTime() - this.startTime)+
                    "ms URL=["+this.req.method+']'+
                    this.req.url+(doRedirect ? ' Redirect='+data.redirect : '') +
                    (typeof data.code === 'undefined' ? '' : ' CODE='+data.code));
        }

        //close session after data sent
        //public content doesn't require a session so in order to not error out we
        //check if the session exists first.
        if (this.session) {
            var self = this;
            this.sessionHandler.close(this.session, function(err/*, result*/) {
                if (_.isError(err)) {
                    log.warn('RequestHandler: Failed to close session [%s]', self.session.uid);
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
        var self = this;

        //infer a response code when not provided
        if(typeof data.code === 'undefined'){
            data.code = 200;
        }

        // If a response code other than 200 is provided, force that code into the head
        var contentType = 'text/html';
        if (typeof data.content_type !== 'undefined') {
            contentType = data.content_type;
        }
        else if (this.themeRoute && this.themeRoute.content_type !== undefined) {
            contentType = this.themeRoute.content_type;
        }

        //send response
        //the catch allows us to prevent any plugins that callback trwice from
        //screwing us over due to the attempt to write headers twice.
        try {
            //set any custom headers
            if (_.isObject(data.headers)) {
                Object.keys(data.headers).forEach(function(header) {
                    self.resp.setHeader(header, data.headers[header]);
                });
            }
            if (Configuration.active.server.x_powered_by) {
                this.resp.setHeader('x-powered-by', Configuration.active.server.x_powered_by);
            }
            this.resp.setHeader('content-type', contentType);
            this.resp.writeHead(data.code);

            //write content
            var content = data.content;
            if (!Buffer.isBuffer(content) && _.isObject(data.content)) {
                content = JSON.stringify(content);
            }
            this.resp.end(content);
        }
        catch(e) {
            log.error('RequestHandler: '+e.stack);
        }
    };

    RequestHandler.prototype.checkSystemSetup = function(context, cb) {
        var result = {success: true};
        if (context.themeRoute.setup_required !== undefined && !context.themeRoute.setup_required) {
            return cb(null, result);
        }
        SettingServiceFactory.getService(Configuration.active.settings.use_memory, Configuration.active.settings.use_cache)
            .get('system_initialized', function(err, isSetup){

                //verify system init
                if (!isSetup) {
                    result.success = false;
                    result.redirect = '/setup';
                }
                cb(err, result);
            });
    };

    /**
     *
     * @method doRedirect
     * @param {String} location
     * @param {Integer} [statusCode=302]
     */
    RequestHandler.prototype.doRedirect = function(location, statusCode) {
        this.resp.statusCode = statusCode || HttpStatusCodes.MOVED_TEMPORARILY;
        this.resp.setHeader("Location", location);
        this.resp.end();
    };

    /**
     * Parses cookies passed for a request
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
     * Determines if the provided URL pathname "/admin/content/articles" is a valid admin URL.
     * @static
     * @method isAdminURL
     * @param {String} urlPath
     * @return {boolean}
     */
    RequestHandler.isAdminURL = function(urlPath) {
        if (urlPath !== null) {

            var index = urlPath.indexOf('/');
            if (index === 0 && urlPath.length > 0) {
                urlPath = urlPath.substring(1);
            }

            var pieces = urlPath.split('/');
            return pieces.length > 0 && pieces[0].indexOf('admin') === 0;
        }
        return false;
    };

    /**
     * @static
     * @method checkPermissions
     * @param {object} context
     * @param {object} context.themeRoute
     * @param {Array} context.themeRoute.permissions
     * @param {object} context.session
     * @param {object} context.session.authentication
     * @param {object} context.session.authentication.user
     * @param {object} context.session.authentication.user.permissions
     * @returns {{success: boolean}}
     */
    RequestHandler.checkPermissions = function(context) {

        var result   = {success: true};
        var reqPerms = context.themeRoute.permissions;
        var auth     = context.session.authentication;
        if (auth && auth.user &&
            auth.admin_level !== SecurityService.ACCESS_ADMINISTRATOR &&
            auth.user.permissions &&
            Array.isArray(reqPerms)) {

            var permMap = auth.user.permissions;
            for(var i = 0; i < reqPerms.length; i++) {

                if (!permMap[reqPerms[i]]) {
                    result.success = false;
                    result.content = '403 Forbidden';
                    result.code    = HttpStatusCodes.FORBIDDEN;
                    break;
                }
            }
        }
        return result;
    };

    /**
     * @static
     * @method checkAdminLevel
     * @param {object} context
     * @param {object} context.themeRoute
     * @param {number} context.themeRoute.access_level
     * @param {object} context.session
     * @param {object} context.session.authentication
     * @param {number} context.session.authentication.admin_level
     * @returns {{success: boolean}}
     */
    RequestHandler.checkAdminLevel = function(context) {

        var result = {success: true};
        if (typeof context.themeRoute.access_level !== 'undefined') {

            if (context.session.authentication.admin_level < context.themeRoute.access_level) {
                result.success = false;
                result.content = '403 Forbidden';
                result.code    = 403;
            }
        }
        return result;
    };

    /**
     * @static
     * @method checkRequiresAuth
     * @param {object} context
     * @param {object} context.themeRoute
     * @param {boolean} context.themeRotue.auth_required
     * @param {object} context.session
     * @param {object} context.session.authentication
     * @param {number} context.session.authentication.user_id
     * @param {Request} context.req
     * @param {string} context.hostname
     * @param {object} context.url
     * @param {string} context.url.href
     * @returns {{success: boolean}}
     */
    RequestHandler.checkRequiresAuth = function(context) {

        var result = {success: true};
        if (context.themeRoute.auth_required === true) {

            if (context.session.authentication.user_id === null || context.session.authentication.user_id === undefined) {
                result.success  = false;
                result.redirect = RequestHandler.isAdminURL(context.url.pathname) ? '/admin/login' : '/user/login';
                context.session.on_login = context.req.method.toLowerCase() === 'get' ? context.url.href :
                    UrlUtils.createSystemUrl('/admin', { hostname: context.hostname });
            }
        }
        return result;
    };

    /**
     * Builds out the context that is passed to a controller
     * @static
     * @method buildControllerContext
     * @param {Request} req
     * @param {Response} res
     * @param {object} extraData
     * @returns {Object}
     */
    RequestHandler.buildControllerContext = function(req, res, extraData) {
        return Object.assign({
            request_handler: req.handler,
            request: req,
            response: res,
            session: req.session,
            localization_service: req.localizationService,
            path_vars: req.pathVars,
            pathVars: req.pathVars,
            query: req.handler.url.query,
            body: req.body,
            site: req.site,
            siteObj: req.siteObj,
            siteName: req.siteName,
            activeTheme: req.activeTheme,
            routeLocalized: !!req.routeTheme.localization
        }, extraData || {});
    };

    module.exports = RequestHandler;
