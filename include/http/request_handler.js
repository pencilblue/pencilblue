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
var url     = require('url');
var fs      = require('fs');
var path    = require('path');
var async   = require('async');
var domain  = require('domain');
var Cookies = require('cookies');
var util    = require('../util.js');
var _       = require('lodash');
var mime    = require('mime');
var HttpStatusCodes = require('http-status-codes');
const pathToRegexp = require('path-to-regexp')

module.exports = function RequestHandlerModule(pb) {
    /**
     * A mapping that provides the interface type to parse the body based on the
     * route specification
     * @private
     * @static
     * @readonly
     * @property BODY_PARSER_MAP
     * @type {Object}
     */
    const BODY_PARSER_MAP = {
        'application/json': pb.JsonBodyParser,
        'application/x-www-form-urlencoded': pb.FormBodyParser,
        'multipart/form-data': pb.FormBodyParser
    };

    const GLOBAL_SITE = pb.SiteService.GLOBAL_SITE;

    class RequestHandler {
        constructor(req, resp) {
            /**
             * @property req
             * @type {Request}
             */
            this.req = req;
            /**
             * @property resp
             * @type {Response}
             */
            this.resp = resp;
            /**
             * @property errorCount
             * @type {number}
             */
            this.errorCount = 0;
        }
        /**
             * Derives the locale and localization instance.
             * @method deriveLocalization
             * @param {Object} context
             * @param {Object} [context.session]
             * @param {String} [context.routeLocalization]
             */
        deriveLocalization(context) {
            var opts = {};
            var sources = [
                context.routeLocalization
            ];
            if (context.session) {
                sources.push(context.session.locale);
            }
            sources.push(this.req.headers[pb.Localization.ACCEPT_LANG_HEADER]);
            if (this.siteObj) {
                opts.supported = Object.keys(this.siteObj.supportedLocales);
                opts.site = this.siteObj.uid;
                sources.push(this.siteObj.defaultLocale);
            }
            var localePrefStr = sources.reduce(function (prev, curr, i) {
                return prev + (curr ? (!!i && !!prev ? ',' : '') + curr : '');
            }, '');
            opts.activeTheme = this.activeTheme || RequestHandler.DEFAULT_THEME;
            //get locale preference
            return new pb.Localization(localePrefStr, opts);
        }
        /**
             * Serves up public content from an absolute file path
             * @method servePublicContent
             * @param {String} [absolutePath] An absolute file path to the resource
             */
        servePublicContent(absolutePath) {
            //check for provided path, then default if necessary
            if (util.isNullOrUndefined(absolutePath)) {
                absolutePath = path.join(pb.config.docRoot, 'public', this.url.pathname);
            }
            var self = this;
            fs.readFile(absolutePath, function (err, content) {
                if (err) {
                    //TODO [1.0] change default content type to JSON and refactor public file serving so it falls inline with other controller functions
                    self.route = !!self.route ? Object.assign({}, self.route) : {};
                    self.route.content_type = 'application/json';
                    return self.serve404();
                }
                //build response structure
                //guess at content-type
                var data = {
                    content: content,
                    content_type: mime.lookup(absolutePath)
                };
                self.req.controllerResult = data;

                //send response
                self.writeResponse(data);
            });
        }
        /**
             * Serves up a 404 page when the path specified by the incoming request does
             * not exist. This function <b>WILL</b> close the connection.
             * @method serve404
             */
        serve404() {
            var error = new Error('NOT FOUND');
            error.code = 404;
            this.serveError(error);
            if (pb.log.isSilly()) {
                pb.log.silly("RequestHandler: No Route Found, Sending 404 for URL=" + this.url.href);
            }
        }
        /**
             * Serves up an error page.  The page is responsible for displaying an error page
             * @method serveError
             * @param {Error} err The failure that was generated by the executed controller
             * @return {Boolean} TRUE when the error is rendered, FALSE if the request had already been handled
             */
        serveError(err, options) {
            if (this.resp.headerSent) {
                return false;
            }
            if (!options) {
                options = {};
            }
            //default the options object
            options = options || {};
            //bump the error count so handlers will know if we are recursively trying to handle errors.
            this.errorCount++;
            //retrieve the active theme.  Sometimes we don't have it such as in the case of the 404.
            var self = this;
            var getActiveTheme = function (cb) {
                if (self.activeTheme) {
                    return cb(null, self.activeTheme);
                }
                self.siteObj = self.siteObj || pb.SiteService.getGlobalSiteContext();
                var settingsService = pb.SettingServiceFactory.getService(pb.config.settings.use_memory, pb.config.settings.use_cache, self.siteObj.uid);
                settingsService.get('active_theme', function (err, activeTheme) {
                    self.activeTheme = activeTheme || pb.config.plugins.default;
                    cb(null, self.activeTheme);
                });
            };
            getActiveTheme(function (error, activeTheme) {
                self.localizationService = self.deriveLocalization({ session: self.session });
                //build out params for handlers
                self.localizationService = self.localizationService || self.deriveLocalization({});
                var params = {
                    mime: self.route && self.route.content_type ? self.route.content_type : 'text/html',
                    error: err,
                    request: self.req,
                    localization: self.localizationService,
                    activeTheme: activeTheme,
                    reqHandler: self,
                    errorCount: self.errorCount
                };
                //hand off to the formatters.  NOTE: the callback may not be called if
                //the handler chooses to fire off a controller.
                var handler = options.handler || function (data) {
                    self.onRenderComplete(data);
                };
                pb.ErrorFormatters.formatForMime(params, function (error, result) {
                    if (util.isError(error)) {
                        pb.log.error('RequestHandler: An error occurred attempting to render an error: %s', error.stack);
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
        }
        /**
             * Parses the incoming request body when the body type specified matches one of
             * those explicitly allowed by the rotue.
             * @method parseBody
             * @param {Array} mimes An array of allowed MIME strings.
             * @param {Function} cb A callback that takes 2 parameters: An Error, if
             * occurred and the parsed body.  The parsed value is often an object but the
             * value is dependent on the parser selected by the content type.
             */
        parseBody(mimes, cb) {
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
            d.run(function () {
                process.nextTick(function () {
                    //initialize the parser and parse content
                    var parser = new BodyParser();
                    parser.parse(self.req, cb);
                });
            });
        }
            /**
         *
         * @method onRenderComplete
         * @param {Error|object} data
         * @param {string} [data.redirect]
         * @param {Integer} [data.code
         */
        onRenderComplete(data){
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
            var doRedirect = typeof data.redirect !== 'undefined';
            if(doRedirect) {
                this.doRedirect(data.redirect, data.statusCode);
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
                        (typeof data.code === 'undefined' ? '' : ' CODE='+data.code));
            }

            //close session after data sent
            //public content doesn't require a session so in order to not error out we
            //check if the session exists first.
            if (this.session) {
                var self = this;
                pb.session.close(this.session, function(err/*, result*/) {
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
        async writeResponse(data) {
            var self = this;
            //infer a response code when not provided
            if (!data.code) {
                data.code = 200;
            }
            // If a response code other than 200 is provided, force that code into the head
            var contentType = 'text/html';
            if (typeof data.content_type !== 'undefined') {
                contentType = data.content_type;
            }
            else if (this.route && this.route.content_type !== undefined) {
                contentType = this.route.content_type;
            }
            //send response
            //the catch allows us to prevent any plugins that callback trwice from
            //screwing us over due to the attempt to write headers twice.
            try {
                //set any custom headers
                if (util.isObject(data.headers)) {
                    Object.keys(data.headers).forEach(function (header) {
                        self.resp.setHeader(header, data.headers[header]);
                    });
                }
                if (pb.config.server.x_powered_by) {
                    try {
                        this.resp.setHeader('x-powered-by', pb.config.server.x_powered_by);
                    }
                    catch (e) {
                        pb.log.error('Failed to set cookie, callback probably called twice: %s', e.stack);
                    }
                }

                var pluginService = new pb.PluginService({
                    site: this.req.site
                });
                pluginService = Promise.promisifyAll(pluginService);
                var settings = await pluginService.getSettingsKVAsync('tn_auth');
                if (settings && settings.enable_CORS && settings.white_listed_origins) {
                    var whiteListedOrigins = settings.white_listed_origins.split(',');
                    var hostname = this.req.headers.referer ? this.req.headers.referer.match(/:\/\/(www[0-9]?\.)?(.[^/]+)/i)[2] : this.hostname;
                    var scheme = this.req.headers.referer ? this.req.headers.referer.match(/^http([s]?):\/\//)[0] : 'https://';

                    if (whiteListedOrigins && whiteListedOrigins.find(origin => {return hostname.indexOf(origin) !== -1;})){
                        this.resp.setHeader('Access-Control-Allow-Origin', scheme + hostname);
                    } else {
                        this.resp.setHeader('Access-Control-Allow-Origin', pb.SiteService.getHostWithProtocol(this.hostname));
                    }
                } else {
                    this.resp.setHeader('Access-Control-Allow-Origin', pb.SiteService.getHostWithProtocol(this.hostname));
                }

                this.resp.setHeader('content-type', contentType);

                const cookies = this.resp.getHeader('set-cookie');
                (cookies || []).forEach((cookie, index) => {
                    if (!/\bsecure\b/g.test(cookie)) {
                        cookies[index] = `${cookie}; Secure`;
                    }
                });
                if (cookies) {
                    this.resp.setHeader('set-cookie', cookies);
                }

                this.resp.writeHead(data.code);
                //write content
                var content = data.content;
                if (!Buffer.isBuffer(content) && util.isObject(data.content)) {
                    content = JSON.stringify(content);
                }

                //This is to handle the js file. Maybe we could find some better way.
                const prefix = this.req && this.req.siteObj && this.req.siteObj.prefix;
                if (prefix && contentType === 'application/javascript' && Buffer.isBuffer(content)) {
                    const strContent = new Buffer(content).toString();

                    // Replace all the window.location.href to be window.redirectHref
                    // Need to include $window.location.href, $window.location.href=, $location.href, and location.href later
                    content = strContent.replace(/(((?:\$?window|s)\.)(?:top.)?)(location\.href)(?=[\=\s])/g, function (match, p1) {
                        return `${p1}redirectHref`;
                    });

                    // Handle some hacks
                    // temp fix, might need to update later.
                    content = content.replace(/\/public\/premium\/?/g, function (match) {
                        return `/${prefix}${match}`;
                    });

                    // Handle the tags in JavaScirpt.
                    content = content.replace(/(\<(?:a|link|script|img|image)(?:[^\>]|\r|\n)*\s(?:ng-href|href|src)\s*=\s*['"]\/)([^\/][^'"\>]*)(['"])/mg, function (match, p1, p2, p3) {
                        if (p2.indexOf(prefix) !== 0 && p2.indexOf(prefix) !== 1) {
                            return `${p1}${prefix}/${p2}${p3}`;
                        } else {
                            return `${p1}${p2}${p3}`;
                        }
                    });

                }

                if (prefix && contentType === 'text/css') {
                    if (Buffer.isBuffer(content)) {
                        content = new Buffer(content).toString();
                    }

                    content = content.replace(/(url\(['"]?)(\/[^'"\)]*['"]?\s*\))/g, function (match, p1, p2) {
                        if (p2.indexOf(prefix) === 0 || p2.indexOf(prefix) === 1) {
                            return match;
                        } else {
                            return `${p1}/${prefix}${p2}`;
                        }

                    });
                }

                this.resp.end(content);
            }
            catch (e) {
                pb.log.error('RequestHandler: ' + e.stack);
            }
        }
        /**
             * Creates a cookie string
             * @method writeCookie
             * @param {Object} descriptor The pieces of the cookie that are to be included
             * in the string.  These pieces are represented as key value pairs.  Each value
             * will be serialized via its implicity "toString" function.
             * @param {String} [cookieStr=''] The current cookie string if it exists
             * @return {String} The cookie represented as a string
             */
        writeCookie(descriptor, cookieStr) {
            return Object.keys(descriptor).reduce(function (cs, key) {
                return cookieStr + key + '=' + descriptor[key] + '; ';
            }, cookieStr || '');
        }
        checkSystemSetup(context, cb) {
            var result = { success: true };
            if (context.route.setup_required !== undefined && !context.route.setup_required) {
                return cb(null, result);
            }
            pb.settings.get('system_initialized', function (err, isSetup) {
                //verify system init
                if (!isSetup) {
                    result.success = false;
                    result.redirect = '/setup';
                }
                cb(err, result);
            });
        }
        /**
             *
             * @method doRedirect
             * @param {String} location
             * @param {Integer} [statusCode=302]
             */
        doRedirect(location, statusCode) {
            this.resp.statusCode = statusCode || pb.HttpStatus.MOVED_TEMPORARILY;

            const prefix = this.req && this.req.siteObj && this.req.siteObj.prefix;
            if (prefix && /^\/(?!admin).*/.test(location)
                    && location.indexOf(prefix) !== 0 && location.indexOf(prefix) !== 1) {
                location = `/${prefix}${location}`
            }

            this.resp.setHeader("Location", location);
            this.resp.end();
        }
        /**
             * Initializes the request handler prototype by registering the core routes for
             * the system.  This should only be called once at startup.
             * @static
             * @method init
             */
        static init() {
            //iterate core routes adding them
            pb.log.debug('RequestHandler: Registering System Routes');
            util.forEach(RequestHandler.CORE_ROUTES, function (descriptor) {
                RequestHandler.registerRoute(descriptor, RequestHandler.DEFAULT_THEME);
            });
        }
        /**
             * Generates the controller callback object that will trigger the redirect
             * header to be sent back as part of the response.
             * @static
             * @method generateRedirect
             * @param {String} location The fully qualified or relative URL to be redirected to
             * @return {Object} The object for the controller to call back with.
             */
        static generateRedirect(location) {
            return {
                redirect: location
            };
        }
        /**
             * @static
             * @method loadSite
             * @param {Object} site
             */
        static loadSite(site) {
            RequestHandler.sites[site.hostname] = site;

            //Populate RequestHandler.redirectHosts if this site has prevHostnames associated
            if (site.prevHostnames) {
                site.prevHostnames.forEach(function (oldHostname) {
                    RequestHandler.redirectHosts[oldHostname] = site.hostname;
                });
            }
        }
        /**
             * @static
             * @method activateSite
             * @param {Object} site
             */
        static activateSite(site) {
            RequestHandler.sites[site.hostname].active = true;
        }
        /**
             * @static
             * @method deactivateSite
             * @param {Object} site
             */
        static deactivateSite(site) {
            RequestHandler.sites[site.hostname].active = false;
        }
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
             * @param {Boolean} [descriptor.localization=false]
             * @param {String} plugin The plugin UID
             * @return {Boolean} TRUE if the route was registered, FALSE if not
             */
        static registerRoute(descriptor, plugin) {
            //Massage descriptor properties
            descriptor.method = (descriptor.method || 'ALL').toUpperCase();
            descriptor.controller = util.isString(descriptor.controller) ? require(descriptor.controller)(pb) : descriptor.controller;
            if (descriptor.localization) {
                descriptor.path = `/:locale?${descriptor.path}`.replace(/\/$/, '');
            }
            _registerRoute(descriptor, plugin);
        }
        /**
             * Attempts to derive the MIME type for a resource path based on the extension
             * of the path.
             * @deprecated since 0.8.0 Use mime.lookup instead
             * @static
             * @method getMimeFromPath
             * @param {string} resourcePath The file path to a resource
             * @return {String|undefined} The MIME type or NULL if could not be derived.
             */
        static getMimeFromPath(resourcePath) {
            return mime.lookup(resourcePath);
        }

        /**
             * Parses cookies passed for a request
             * @static
             * @method parseCookies
             * @param {Request} req
             * @return {Object}
             */
        static parseCookies(req) {
            var parsedCookies = {};
            if (req.headers.cookie) {
                var cookieParameters = req.headers.cookie.split(';');
                for (var i = 0; i < cookieParameters.length; i++) {
                    var keyVal = cookieParameters[i].split('=');
                    parsedCookies[keyVal[0]] = keyVal[1];
                }
            }
            return parsedCookies;
        }
        /**
             * Checks to see if the URL exists in the current context of the system
             * @static
             * @method urlExists
             * @param {String} url
             * @param {string} id
             * @param {string} [site]
             * @param {function} cb (Error, boolean)
             */
        static urlExists(url, id, site, cb) {
            var dao = new pb.DAO();
            if (typeof site === 'function') {
                cb = site;
                site = undefined;
            }
            var getTask = function (collection) {
                return function (callback) {
                    var where = { url: url };
                    if (site) {
                        where.site = site;
                    }
                    if (id) {
                        where[pb.DAO.getIdField()] = pb.DAO.getNotIdField(id);
                    }
                    dao.count(collection, where, function (err, count) {
                        if (util.isError(err) || count > 0) {
                            callback(true, count);
                        }
                        else {
                            callback(null, count);
                        }
                    });
                };
            };
            async.series([getTask('article'), getTask('page')], function (err /*, results*/) {
                cb(err, err !== null);
            });
        }
        /**
             * Determines if the provided URL pathname "/admin/content/articles" is a valid admin URL.
             * @static
             * @method isAdminURL
             * @param {String} urlPath
             * @return {boolean}
             */
        static isAdminURL(urlPath) {
            if (urlPath !== null) {
                var index = urlPath.indexOf('/');
                if (index === 0 && urlPath.length > 0) {
                    urlPath = urlPath.substring(1);
                }
                var pieces = urlPath.split('/');
                return pieces.length > 0 && pieces[0].indexOf('admin') === 0;
            }
            return false;
        }
        /**
             *
             * @static
             * @method isSystemSafeURL
             * @param {String} url
             * @param {String} id
             * @param {string} [site]
             * @param {Function} cb
             */
        static isSystemSafeURL(url, id, site, cb) {
            if (typeof site === 'function') {
                cb = site;
                site = undefined;
            }
            if (url === null || RequestHandler.isAdminURL(url)) {
                return cb(null, false);
            }
            RequestHandler.urlExists(url, id, site, function (err, exists) {
                cb(err, !exists);
            });
        }
        /**
             * @static
             * @method checkPermissions
             * @param {object} context
             * @param {object} context.route
             * @param {Array} context.route.permissions
             * @param {object} context.session
             * @param {object} context.session.authentication
             * @param {object} context.session.authentication.user
             * @param {object} context.session.authentication.user.permissions
             * @returns {{success: boolean}}
             */
        static checkPermissions(context) {
            var result = { success: true };
            var reqPerms = context.route.permissions;
            var auth = context.session.authentication;
            if (auth && auth.user &&
                auth.admin_level !== pb.SecurityService.ACCESS_ADMINISTRATOR &&
                auth.user.permissions &&
                util.isArray(reqPerms)) {
                var permMap = auth.user.permissions;
                for (var i = 0; i < reqPerms.length; i++) {
                    if (!permMap[reqPerms[i]]) {
                        result.success = false;
                        result.content = '403 Forbidden';
                        result.code = HttpStatusCodes.FORBIDDEN;
                        break;
                    }
                }
            }
            return result;
        }
        /**
             * @static
             * @method checkAdminLevel
             * @param {object} context
             * @param {object} context.route
             * @param {number} context.route.access_level
             * @param {object} context.session
             * @param {object} context.session.authentication
             * @param {number} context.session.authentication.admin_level
             * @returns {{success: boolean}}
             */
        static checkAdminLevel(context) {
            var result = { success: true };
            if (typeof context.route.access_level !== 'undefined') {
                if (context.session.authentication.admin_level < context.route.access_level) {
                    result.success = false;
                    result.content = '403 Forbidden';
                    result.code = 403;
                }
            }
            return result;
        }
        /**
             * @static
             * @method checkRequiresAuth
             * @param {object} context
             * @param {object} context.route
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
        static checkRequiresAuth(context) {
            var result = { success: true };
            if (context.route.auth_required === true) {
                if (context.session.authentication.user_id === null || context.session.authentication.user_id === undefined) {
                    result.success = false;
                    result.redirect = RequestHandler.isAdminURL(context.url.pathname) ? '/admin/login' : '/user/login';
                    context.session.on_login = context.req.method.toLowerCase() === 'get' ? context.url.href :
                        pb.UrlService.createSystemUrl('/admin', { hostname: context.hostname });
                }
            }
            return result;
        }
        /**
             * Builds out the context that is passed to a controller
             * @static
             * @method buildControllerContext
             * @param {Request} req
             * @param {Response} res
             * @param {object} extraData
             * @returns {Object}
             */
        static buildControllerContext(req, res, extraData) {
            req = req || {};
            req.handler = req.handler || {};
            return util.merge(extraData || {}, {
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
                activeTheme: req.activeTheme || 'pencilblue',
                routeLocalized: !!(req.handler.route ? req.handler.route.localization : false)
            });
        }
    }

    /**
     * The fallback theme (pencilblue)
     * @static
     * @property DEFAULT_THEME
     * @type {String}
     */
    RequestHandler.DEFAULT_THEME = pb.config.plugins.default;

    /**
     * The internal storage of routes after they are validated and processed.
     * @protected
     * @static
     * @property storage
     * @type {Array}
     */
    RequestHandler.storage = {};
    RequestHandler.sites = {};
    RequestHandler.redirectHosts = {};

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
    RequestHandler.CORE_ROUTES = require(path.join(pb.config.plugins.directory, '/pencilblue/include/routes.js'))(pb);

    /**
     *
     * @private
     * @static
     * @method _registerRoute
     * @param {Object} descriptor
     * @param {String} plugin
     * @return {Boolean}
     */
    function _registerRoute(descriptor, plugin) {
        const routePath = `['${plugin}']['${descriptor.path}']`
        let route = _.get(RequestHandler.storage, routePath)

        if (!route) {
            let pathVars = []
            let pattern = pathToRegexp(descriptor.path, pathVars)
            route = {
                pattern,
                pathVars,
            }
            _.set(RequestHandler.storage, routePath, route)
        }

        _.set(route, `descriptors['${descriptor.method}']`, Object.freeze(descriptor))
    }

    return RequestHandler;
};
