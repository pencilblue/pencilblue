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

    function Middleware() {}

    var DEFAULT_MIDDLEWARE = [
        'startTime', 'urlParse', 'checkPublicRoute', 'principal', 'deriveSite', 'deriveRoute', 'deriveActiveTheme',
        'deriveRouteTheme', 'emitRouteThemeRetrieved', 'inactiveAccessCheck', 'systemSetupCheck',
        'requiresAuthenticationCheck', 'authorizationCheck', 'derivePathVariables', 'localizedRouteCheck',
        'instantiateController', 'parseRequestBody', 'initializeController', 'render', 'writeSessionCookie',
        'writeResponse', 'responseTime', 'principalClose'
    ];


    Middleware.startTime = function (req, res, next) {
        req.startTime = (new Date()).getTime();
        req.handler.startTime = req.startTime;
        next();
    };

    Middleware.urlParse = function (req, res, next) {
        req.handler.url = url.parse(req.url, true);
        req.handler.hostname = req.headers.host || pb.SiteService.getGlobalSiteContext().hostname;
        next();
    };

    Middleware.checkPublicRoute = function (req, res, next) {
        if (RequestHandler.isPublicRoute(req.handler.url.pathname)) {
            return req.handler.servePublicContent();
        }//TODO ensure this still follows through with setting cookie and timings

        //only continue when content is not public
        next();
    };

    Middleware.principal = function (req, res, next) {

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
    };

    Middleware.deriveSite = function (req, res, next) {
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
    };

    Middleware.deriveRoute = function (req, res, next) {

        var route = req.handler.getRoute(req.handler.url.pathname);
        if (route === null) {
            return next(ErrorUtils.notFound());
        }
        req.handler.route = req.route = route;

        next();
    };

    Middleware.deriveActiveTheme = function (req, res, next) {
        var settings = pb.SettingServiceFactory.getService(pb.config.settings.use_memory, pb.config.settings.use_cache, req.siteObj.uid);
        settings.get('active_theme', function (err, activeTheme) {
            if (!activeTheme) {
                pb.log.warn("RequestHandler: The active theme is not set.  Defaulting to '%s'", pb.config.plugins.default);
                activeTheme = pb.config.plugins.default;
            }

            req.handler.activeTheme = req.activeTheme = activeTheme;

            next();
        });
    };

    Middleware.deriveRouteTheme = function (req, res, next) {

        //routeTheme describes the site/theme/method combo
        var rt = req.handler.routeTheme = req.routeTheme = req.handler.getRouteTheme(req.activeTheme, req.route);
        if (rt.theme === null || rt.method === null || rt.site === null) {
            return next(ErrorUtils.notFound());
        }

        //while themeRoute describes the specific route definition based on the theme
        //TODO [1.0] super confusing and should be changed
        req.handler.themeRoute = req.themeRoute = req.route.themes[rt.site][rt.theme][rt.method];
        if (pb.log.isSilly()) {
            pb.log.silly("RequestHandler: Settling on theme [%s] and method [%s] for URL=[%s:%s]", rt.theme, rt.method, req.method, req.handler.url.href);
        }

        next();
    };

    Middleware.emitRouteThemeRetrieved = function (req, res, next) {
        req.handler.emitThemeRouteRetrieved(next);
    };

    Middleware.inactiveAccessCheck = function (req, res, next) {
        var inactiveSiteAccess = req.themeRoute.inactive_site_access;
        if (!req.siteObj.active && !inactiveSiteAccess) {
            if (req.siteObj.uid === pb.SiteService.GLOBAL_SITE) {
                return req.router.redirect('/admin');
            }
            else {
                return next(ErrorUtils.notFound());
            }
        }

        next();
    };


    Middleware.systemSetupCheck = function (req, res, next) {
        var ctx = {
            themeRoute: req.themeRoute
        };
        req.handler.checkSystemSetup(ctx, function(err, result) {
            if (util.isError(err)) {
                return next(err);
            }

            //setup has not been completed so redirect that way
            if (!result.success) {
                return req.router.redirect(result.redirect);
            }
            next();
        });
    };

    Middleware.requiresAuthenticationCheck = function (req, res, next) {
        var ctx = {
            themeRoute: req.themeRoute,
            session: req.session,
            req: req,
            hostname: req.handler.hostname,
            url: req.handler.url
        };
        var result = RequestHandler.checkRequiresAuth(ctx);
        next(result.redirect ? ErrorUtils.notAuthorized() : null);
    };

    Middleware.authorizationCheck = function(req, res, next) {
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
        next(result.success ? null : ErrorUtils.forbidden());
    };

    Middleware.derivePathVariables = function (req, res, next) {
        req.pathVars = req.handler.getPathVariables(req.route);
        next();
    };

    Middleware.localizedRouteCheck = function (req, res, next) {
        var pathVars = req.pathVars;
        if (typeof pathVars.locale !== 'undefined') {
            if (!this.siteObj.supportedLocales[pathVars.locale]) {
                return next(ErrorUtils.notFound());
            }

            //update the localization
            req.handler.localizationService = req.localizationService = req.handler.deriveLocalization({
                session: this.session,
                routeLocalization: pathVars.locale
            });
        }
        next();
    };

    Middleware.instantiateController = function (req, res, next) {

        var rt = req.routeTheme;
        var ControllerType = req.route.themes[rt.site][rt.theme][rt.method].controller;
        req.controllerInstance = new ControllerType();

        next();
    };

    Middleware.parseRequestBody = function (req, res, next) {
        req.handler.parseBody(req.themeRoute.request_body, function (err, body) {
            if (util.isError(err)) {
                err.code = 400;
            }
            req.body = body;
            next(err);
        });
    };

    Middleware.initializeController = function (req, res, next) {
        var props = RequestHandler.buildControllerContext(req, res);
        req.controllerInstance.init(props, next);
    };

    Middleware.render = function (req, res, next) {
        req.controllerInstance[req.themeRoute.handler ? req.themeRoute.handler : 'render'](function (result) {
            if (util.isError(result)) {
                return next(result);
            }
            req.controllerResult = result;
            next();
        });
    };

    Middleware.writeSessionCookie = function (req, res, next) {
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
    };

    Middleware.writeResponse = function (req, res, next) {
        var data = req.controllerResult;
        var doRedirect = typeof data.redirect !== 'undefined';
        if (doRedirect) {
            req.didRedirect = true;
            req.handler.doRedirect(data.redirect, data.code);
        }
        else {
            req.handler.writeResponse(data);
        }
        next();
    };

    Middleware.responseTime = function (req, res, next) {
        req.endTime = (new Date()).getTime();
        if (pb.log.isDebug()) {
            pb.log.debug("Response Time: %sms URL=%s REDIRECT=%s %s",
                req.endTime - req.startTime,
                req.url,
                req.didRedirect ? ' Redirect=' + req.controllerResult.redirect : '',
                (typeof req.controllerResult.code === 'undefined' ? '' : ' CODE=' + req.controllerResult.code));
        }
        next();
    };

    Middleware.principalClose = function (req, res, next) {

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
    };

    Middleware.getAll = function() {
        return DEFAULT_MIDDLEWARE.map(function(middlewareName) {
            return {
                name: middlewareName,
                action: Middleware[middlewareName]
            };
        });
    };

    return Middleware;
};
