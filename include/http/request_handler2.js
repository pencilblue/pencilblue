'use strict';

//dependencies
var url = require('url');
var util = require('util');
var HttpStatus = require('http-status-codes');

module.exports = function (pb) {

    class RequestHandler2 {
        constructor() {
        }

        handle(req, res) {//TODO optimize when sync

            //set reference to the handler
            req.handler = this;

            // initialize completion function
            var done = function (err) {
                //TODO check on error
            };

            //create execution loop
            var cnt = 0;
            var execute = function (index) {
                if (index >= RequestHandler2.middleware.length) {
                    return done();
                }

                //execute the next task
                var sync = true;
                var action = RequestHandler2.middleware[index].action;
                action(req, res, function (err) {
                    if (err) {
                        return done(err);
                    }

                    // delay by a tick when reaching here synchronously otherwise just proceed
                    cnt++;
                    if (sync) {
                        process.nextTick(function() {
                            execute(cnt);
                        });
                    }
                    else {
                        execute(cnt);
                    }
                });
                sync = false;
            };
            execute(0);
        }

        static removeMiddleware(name) {
            return RequestHandler2.replaceMiddleware(name, undefined);
        }

        static replaceMiddleware(name, middleware) {
            var index = RequestHandler2.indexOfMiddleware(name);
            if (index >= 0) {
                RequestHandler2.middleware.splice(index, 1, middleware);
                return true;
            }
            return false;
        }

        static addMiddlewareAfter(name, middleware) {
            var index = RequestHandler2.indexOfMiddleware(name);
            if (index >= 0) {
                return RequestHandler2.addMiddlewareAt(index + 1, middleware);
            }
            return false;
        }

        static addMiddlewareAfterAll(middleware) {
            return RequestHandler2.addMiddlewareAt(RequestHandler2.middleware.length, middleware);
        }

        static addMiddlewareBefore(name, middleware) {
            var index = RequestHandler2.indexOfMiddleware(name);
            if (index >= 0) {
                return RequestHandler2.addMiddlewareAt(index, middleware);
            }
            return false;
        }

        static addMiddlewareBeforeAll(middleware) {
            return RequestHandler2.addMiddlewareAt(0, middleware);
        }

        static addMiddlewareAt(index, middleware) {
            RequestHandler2.middleware.splice(index, 0, middleware);
            return true;
        }

        static indexOfMiddleware(name) {
            for (var i = 0; i < RequestHandler2.middleware.length; i++) {
                if (RequestHandler2.middleware[i].name === name) {
                    return i;
                }
            }
            return -1;
        }

        static init() {

            var middleware = [
                {
                    name: 'startTime',
                    action: function (req, res, next) {
                        req.startTime = (new Date()).getTime();
                        req.handler.startTime = req.startTime;
                        next();
                    }
                },

                {
                    name: 'urlParse',
                    action: function (req, res, next) {
                        req.handler.url = url.parse(req.url, true);
                        req.handler.hostname  = req.headers.host || pb.SiteService.getGlobalSiteContext().hostname;
                        next();
                    }
                },

                {
                    name: 'checkPublicRoute',
                    action: function (req, res, next) {
                        if (RequestHandler2.isPublicRoute(this.url.pathname)) {
                            return req.handler.servePublicContent();
                        }

                        //only continue when content is not public
                        next();
                    }
                },

                {
                    name: 'principal',
                    action: function(req, res, next) {

                        //check for session cookie
                        var cookies = RequestHandler2.parseCookies(req);
                        req.headers[pb.SessionHandler.COOKIE_HEADER] = cookies;

                        //open session
                        pb.session.open(req, function(err, session){
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
                            req.handler.setSessionCookie =  sc || se;
                            if (pb.log.isSilly()) {
                                pb.log.silly("RequestHandler: Session ID [%s] Cookie SID [%s] Created [%s] Expired [%s]", session.uid, cookies.session_id, sc, se);
                            }

                            //continue processing
                            req.handler.session = session;
                            req.session = session;
                            next();
                        });
                    }
                },

                {
                    name: 'deriveSite',
                    action: function(req, res, next) {
                        var hostname = req.handler.hostname;
                        var siteObj = RequestHandler2.sites[hostname];
                        var redirectHost = RequestHandler2.redirectHosts[hostname];

                        // If we need to redirect to a different host
                        if (!siteObj && redirectHost && RequestHandler2.sites[redirectHost]) {
                            return req.handler.doRedirect(pb.SiteService.getHostWithProtocol(redirectHost), HttpStatus.MOVED_PERMANENTLY);
                        }
                        req.handler.siteObj = req.siteObj = siteObj;

                        //derive the localization. We do it here so that if the site isn't
                        //available we can still have one available when we error out
                        req.handler.localizationService = req.localizationService = req.handler.deriveLocalization({ session: req.session });

                        //make sure we have a site
                        if (!siteObj) {
                            return next(new Error("The host (" + hostname + ") has not been registered with a site. In single site mode, you must use your site root (" + pb.config.siteRoot + ")."));
                        }

                        req.handler.site = req.site = req.handler.siteObj.uid;
                        req.handler.siteName = req.siteName = req.handler.siteObj.displayName;

                        next();
                    }
                },

                {
                    name: 'deriveRoute',
                    action: function(req, res, next) {

                        var route = req.handler.getRoute(req.handler.url.pathname);
                        if (route === null) {
                            return req.handler.serve404();
                        }
                        req.handler.route = req.route = route;

                        next();
                    }
                },

                {
                    name: 'deriveActiveTheme',
                    action: function(req, res, next) {
                        var settings = pb.SettingServiceFactory.getService(pb.config.settings.use_memory, pb.config.settings.use_cache, req.siteObj.uid);
                        settings.get('active_theme', function(err, activeTheme){
                            if (!activeTheme) {
                                pb.log.warn("RequestHandler: The active theme is not set.  Defaulting to '%s'", pb.config.plugins.default);
                                activeTheme = pb.config.plugins.default;
                            }

                            req.handler.activeTheme = req.activeTheme = activeTheme;

                            next();
                        });
                    }
                },

                {
                    name: 'deriveRouteTheme',
                    action: function(req, res, next) {
                        var rt = req.handler.routeTheme = req.routeTheme = req.handler.getRouteTheme(req.activeTheme, req.route);

                        if (pb.log.isSilly()) {
                            pb.log.silly("RequestHandler: Settling on theme [%s] and method [%s] for URL=[%s:%s]", rt.theme, rt.method, req.method, req.handler.url.href);
                        }

                        next();
                    }
                },

                {
                    name: 'emitRouteThemeRetrieved',
                    action: function(req, res, next) {
                        req.handler.emitThemeRouteRetrieved(next);
                    }
                },

                {
                    name: 'inactiveAccessCheck',
                    action: function(req, res, next) {
                        var rt = req.routeTheme;
                        if (rt.theme === null || rt.method === null || rt.site === null) {
                            return req.handler.serve404();
                        }

                        var inactiveSiteAccess = req.route.themes[rt.site][rt.theme][rt.method].inactive_site_access;
                        if (!req.siteObj.active && !inactiveSiteAccess) {
                            if (req.siteObj.uid === pb.SiteService.GLOBAL_SITE) {
                                return req.handler.doRedirect('/admin');
                            }
                            else {
                                return req.handler.serve404();
                            }
                        }

                        next();
                    }
                },

                {
                    name: 'routeSecurityCheck',
                    action: function(req, res, next) {
                        var rt = req.routeTheme;
                        req.handler.checkSecurity(rt.theme, rt.method, rt.site, function(err, result) {
                            if (pb.log.isSilly()) {
                                pb.log.silly('RequestHandler: Security Result=[%s] - %s', result.success, JSON.stringify(result.results));
                            }
                            next(err);
                        });
                    }
                }

            ].forEach(function(middlewareObj) {
                RequestHandler2.addMiddlewareAfterAll(middlewareObj);
            });
        }
    }

    RequestHandler2.middleware = [];

    return RequestHandler2;
};
