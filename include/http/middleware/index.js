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
var url = require('url');
var Cookies = require('cookies');
var HttpStatus = require('http-status-codes');
var ErrorUtils = require('../../error/error_utils');

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;
    var RequestHandler = pb.RequestHandler;

    //private static variables
    /**
     * @private
     * @static
     * @property DEFAULT_MIDDLEWARE
     * @type {string[]}
     */
    var DEFAULT_MIDDLEWARE = [
        'startTime', 'urlParse', 'checkPublicRoute', 'principal', 'deriveSite', 'deriveRoute', 'deriveActiveTheme',
        'deriveRouteTheme', 'emitRouteThemeRetrieved', 'inactiveAccessCheck', 'systemSetupCheck',
        'requiresAuthenticationCheck', 'authorizationCheck', 'derivePathVariables', 'localizedRouteCheck',
        'instantiateController', 'parseRequestBody', 'initializeController', 'render', 'writeSessionCookie',
        'writeResponse', 'responseTime', 'principalClose'
    ];

    /**
     * Provides the set of default middleware.
     * @class Middleware
     */
    class Middleware {

        /**
         * Responsible for setting the start time for the request
         * @static
         * @method startTime
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static startTime (req, res, next) {
            req.startTime = (new Date()).getTime();
            req.handler.startTime = req.startTime;
            next();
        }

        /**
         * Parses the incoming URL
         * @static
         * @method urlParse
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static urlParse (req, res, next) {
            req.handler.url = url.parse(req.url, true);
            req.handler.hostname = req.headers.host || pb.SiteService.getGlobalSiteContext().hostname;
            next();
        }

        /**
         * Looks to see if the incoming route maps to a public resource
         * @static
         * @method checkPublicRoute
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static checkPublicRoute (req, res, next) {
            if (RequestHandler.isPublicRoute(req.handler.url.pathname)) {
                return req.handler.servePublicContent();
            }//TODO ensure this still follows through with setting cookie and timings

            //only continue when content is not public
            next();
        }

        /**
         * Derives the principal for the request based on the incoming cookie
         * @static
         * @method principal
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static principal (req, res, next) {

            //check for session cookie
            var cookies = RequestHandler.parseCookies(req);
            req.headers[pb.SessionHandler.COOKIE_HEADER] = cookies;

            //open session
            pb.session.open(req, function (err, session) {
                if (util.isError(err)) {
                    return next(err);
                }
                if (!session) {
                    return next(new Error("The session object was not valid.  Unable to generate a session object based on request."));
                }
                //set the session id when no session has started or the current one has
                //expired.
                var sc = Object.keys(cookies).length === 0;
                var se = !sc && cookies.session_id !== session.uid;
                req.handler.setSessionCookie = req.setSessionCookie = sc || se;
                if (pb.log.isSilly()) {
                    pb.log.silly("RequestHandler: Session ID [%s] Cookie SID [%s] Created [%s] Expired [%s]", session.uid, cookies.session_id, sc, se);
                }

                //continue processing
                req.handler.session = req.session = session;
                next();
            });
        }

        /**
         * Derives the intended site based on hostname of the incoming request
         * @static
         * @method deriveSite
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static deriveSite (req, res, next) {
            var hostname = req.handler.hostname;
            var siteObj = RequestHandler.sites[hostname];
            var redirectHost = RequestHandler.redirectHosts[hostname];

            // If we need to redirect to a different host
            if (!siteObj && redirectHost && RequestHandler.sites[redirectHost]) {
                return req.router.redirect(pb.SiteService.getHostWithProtocol(redirectHost), HttpStatus.MOVED_PERMANENTLY);
            }
            req.handler.siteObj = req.siteObj = siteObj;

            //derive the localization. We do it here so that if the site isn't
            //available we can still have one available when we error out
            req.handler.localizationService = req.localizationService = req.handler.deriveLocalization({session: req.session});

            //make sure we have a site
            if (!siteObj) {
                return next(new Error("The host (" + hostname + ") has not been registered with a site. In single site mode, you must use your site root (" + pb.config.siteRoot + ")."));
            }

            req.handler.site = req.site = req.handler.siteObj.uid;
            req.handler.siteName = req.siteName = req.handler.siteObj.displayName;

            next();
        }

        /**
         * Looks up the current route based on the incoming URL
         * @static
         * @method deriveRoute
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static deriveRoute (req, res, next) {

            var route = req.handler.getRoute(req.handler.url.pathname);
            if (route === null) {
                return next(ErrorUtils.notFound());
            }
            req.handler.route = req.route = route;

            next();
        }

        /**
         * Looks up the active theme
         * @static
         * @method deriveActiveTheme
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static deriveActiveTheme (req, res, next) {
            var settings = pb.SettingServiceFactory.getService(pb.config.settings.use_memory, pb.config.settings.use_cache, req.siteObj.uid);
            settings.get('active_theme', function (err, activeTheme) {
                if (util.isError(err)) {
                    return next(err);
                }
                if (!activeTheme) {
                    pb.log.warn("RequestHandler: The active theme is not set.  Defaulting to '%s'", pb.config.plugins.default);
                    activeTheme = pb.config.plugins.default;
                }

                req.handler.activeTheme = req.activeTheme = activeTheme;

                next();
            });
        }

        /**
         * Derives the route theme
         * @static
         * @method deriveRouteTheme
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static deriveRouteTheme (req, res, next) {

            // routeTheme describes the site/theme/method combo
            var rt = req.handler.routeTheme = req.routeTheme = req.handler.getRouteTheme(req.activeTheme, req.route);
            if (rt.theme === null || rt.method === null || rt.site === null) {
                return next(ErrorUtils.notFound());
            }

            // themeRoute describes the specific route definition based on the theme
            // TODO [1.0] super confusing and should be changed
            req.handler.themeRoute = req.themeRoute = req.route.themes[rt.site][rt.theme][rt.method];
            if (pb.log.isSilly()) {
                pb.log.silly("RequestHandler: Settling on theme [%s] and method [%s] for URL=[%s:%s]", rt.theme, rt.method, req.method, req.handler.url.href);
            }

            next();
        }

        /**
         * Responsible for emitting the route theme retrieved event.
         * @static
         * @method emitRouteThemeRetrieved
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static emitRouteThemeRetrieved (req, res, next) {
            req.handler.emitThemeRouteRetrieved(next);
        }

        /**
         * Determines whether or not the request can be made against an inactive site. If the site is global and the
         * route does not allow inactive access then the entity is redirected to the admin section. Otherwise, if the
         * site is not global then a Not Found error is found.
         * @static
         * @method inactiveAccessCheck
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static inactiveAccessCheck (req, res, next) {
            var inactiveSiteAccess = req.themeRoute.inactive_site_access;
            if (!req.siteObj.active && !inactiveSiteAccess) {
                if (req.siteObj.uid === pb.SiteService.GLOBAL_SITE) {
                    return req.router.redirect('/admin');
                }
                return next(ErrorUtils.notFound());
            }

            next();
        }

        /**
         * Verifies that the system has already gone through the setup process.  When the check fails the system is
         * redirected to the setup page
         * @static
         * @method systemSetupCheck
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static systemSetupCheck (req, res, next) {
            var ctx = {
                themeRoute: req.themeRoute
            };
            req.handler.checkSystemSetup(ctx, function (err, result) {
                if (util.isError(err)) {
                    return next(err);
                }

                //setup has not been completed so redirect that way
                if (!result.success) {
                    return req.router.redirect(result.redirect);
                }
                next();
            });
        }

        /**
         * Responsible for ensuring that the entity that is sending the request has been authenticated.  When the check
         * fails a 401 NOT AUTHORIZED is thrown
         * @static
         * @method requiresAuthenticationCheck
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static requiresAuthenticationCheck (req, res, next) {
            var ctx = {
                themeRoute: req.themeRoute,
                session: req.session,
                req: req,
                hostname: req.handler.hostname,
                url: req.handler.url
            };
            var result = RequestHandler.checkRequiresAuth(ctx);
            next(result.redirect ? ErrorUtils.notAuthorized() : null);
        }

        /**
         * Responsible for ensuring that the entity that is sending the request has proper authorization to access the
         * request resource. First a role check is made and if that passes then permissions are examined.  When the
         * authorization check fails a 403 FORBIDDEN error is thrown
         * @static
         * @method authorizationCheck
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static authorizationCheck (req, res, next) {
            var ctx = {
                themeRoute: req.themeRoute,
                session: req.session
            };

            //check role
            var result = RequestHandler.checkAdminLevel(ctx);
            if (!result.success) {
                return next(ErrorUtils.forbidden());
            }

            //check permissions
            result = RequestHandler.checkPermissions(ctx);
            if (!result.success && pb.log.isDebug()) {
                pb.log.debug('AuthCheck: %s', result.message);
            }
            next(result.success ? null : ErrorUtils.forbidden());
        }

        /**
         * Extracts path variables out of the route's path and assigns them to the request instances "pathVars" variable
         * @static
         * @method derivePathVariables
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static derivePathVariables (req, res, next) {
            req.pathVars = req.handler.getPathVariables(req.route);
            next();
        }

        /**
         * Responsible for determining if the route is localized.  If the derived site does not support the locale
         * inside of the route path the middleware will throw a Not Found error
         * @static
         * @method localizedRouteCheck
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static localizedRouteCheck (req, res, next) {
            var pathVars = req.pathVars;
            if (typeof pathVars.locale !== 'undefined') {
                if (!req.siteObj.supportedLocales[pathVars.locale]) {
                    return next(ErrorUtils.notFound());
                }

                //update the localization
                req.handler.localizationService = req.localizationService = req.handler.deriveLocalization({
                    session: req.session,
                    routeLocalization: pathVars.locale
                });
            }
            next();
        }

        /**
         * Instantiates an instance of the controller that maps to the derived route based on the active site, theme,
         * and HTTP method combination.
         * @static
         * @method instantiateController
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static instantiateController (req, res, next) {

            var rt = req.routeTheme;
            var ControllerType = req.route.themes[rt.site][rt.theme][rt.method].controller;
            req.controllerInstance = new ControllerType();

            next();
        }

        /**
         * Responsible for parsing the incoming request body
         * @static
         * @method parseRequestBody
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static parseRequestBody (req, res, next) {
            req.handler.parseBody(req.themeRoute.request_body, function (err, body) {
                if (util.isError(err)) {
                    err.code = HttpStatus.BAD_REQUEST;
                }
                req.body = body;
                next(err);
            });
        }

        /**
         * Takes the controller instance and calls the "init" function to ensure the controller is ready to render the
         * result
         * @static
         * @method initializeController
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static initializeController (req, res, next) {
            var props = RequestHandler.buildControllerContext(req, res, {});
            req.controllerInstance.init(props, next);
        }

        /**
         * Responsible for taking the initialized controller and executing its rendering handler.  The result of the
         * rendering is set on the request object as "controllerResult".
         * @static
         * @method render
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static render (req, res, next) {
            req.controllerInstance[req.themeRoute.handler ? req.themeRoute.handler : 'render'](function (result) {
                if (util.isError(result)) {
                    return next(result);
                }
                req.controllerResult = result;
                next();
            });
        }

        /**
         * When no cookie is detected for the current request this middleware writes the session cookie to the response
         * @static
         * @method writeSessionCookie
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static writeSessionCookie (req, res, next) {
            var cookies = new Cookies(req, res);
            if (req.setSessionCookie) {
                try {
                    cookies.set(pb.SessionHandler.COOKIE_NAME, req.session.uid, pb.SessionHandler.getSessionCookie(req.session));
                }
                catch (e) {
                    pb.log.error('RequestHandler: Failed to set cookie: %s', e.stack);
                }
            }
            next();
        }

        /**
         * Responsible for writing the result of the request to the response stream.  When the result contains a redirect
         * parameter the middleware assumes that the controller result was a redirect result and creates a redirect response
         * @static
         * @method writeResponse
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static writeResponse (req, res, next) {
            var data = req.controllerResult;
            req.didRedirect = typeof data.redirect === 'string';
            if (req.didRedirect) {
                req.handler.doRedirect(data.redirect, data.code);
            }
            else {
                req.handler.writeResponse(data);
            }
            next();
        }

        /**
         * Responsible for calculating the time the server took to respond.  The result will be logged if the log level
         * is debug or silly
         * @static
         * @method responseTime
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static responseTime (req, res, next) {
            req.endTime = (new Date()).getTime();
            if (pb.log.isDebug()) {
                pb.log.debug("Response Time: %sms URL=%s%s%s",
                    req.endTime - req.startTime,
                    req.url,
                    req.didRedirect ? ' Redirect=' + req.controllerResult.redirect : '',
                    (typeof req.controllerResult.code === 'undefined' ? '' : ' CODE=' + req.controllerResult.code));
            }
            next();
        }

        /**
         * Closes the session by persisting it back to the session store.
         * @static
         * @method principalClose
         * @param {Request} req The current request to process
         * @param {Response} res The response object that compliments the current request
         * @param {function} next (Error) Callback function that takes a single parameter, an error if it occurred
         */
        static principalClose (req, res, next) {

            //close session after data sent
            //public content doesn't require a session so in order to not error out we
            //check if the session exists first.
            if (req.session) {
                pb.session.close(req.session, function (err/*, result*/) {
                    if (util.isError(err)) {
                        pb.log.warn('RequestHandler: Failed to close session [%s]', req.session.uid);
                    }
                });
            }
            next();
        }

        /**
         * Retrieves all of the default middleware.
         * @static
         * @method getAll
         * @returns {Array}
         */
        static getAll () {
            return DEFAULT_MIDDLEWARE.map(function (middlewareName) {
                return {
                    name: middlewareName,
                    action: Middleware[middlewareName]
                };
            });
        }
    }

    return Middleware;
};
