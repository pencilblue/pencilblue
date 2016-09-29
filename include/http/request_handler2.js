'use strict';

//dependencies
var async = require('async');
var url = require('url');

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
                var action = RequestHandler2.middleware[index];
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
                RequestHandler2.middlewareIndex.splice(index, 1, middleware.name);
                RequestHandler2.middleware.splice(index, 1, middleware.action);
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
            RequestHandler2.middlewareIndex.splice(index, 0, middleware.name);
            RequestHandler2.middleware.splice(index, 0, middleware.action);
            return true;
        }

        static indexOfMiddleware(name) {
            return RequestHandler2.middlewareIndex.indexOf(name);
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


            ].forEach(function(middlewareObj) {
                RequestHandler2.addMiddlewareAfterAll(middlewareObj);
            });
        }
    }

    RequestHandler2.middlewareIndex = [];
    RequestHandler2.middleware = [];

    return RequestHandler2;
};
