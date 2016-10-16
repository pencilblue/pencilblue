'use strict';

//dependencies
var url = require('url');
var util = require('util');

module.exports = function (pb) {

    //pb dependencies
    var RequestHandler = pb.RequestHandler;

    class Router {
        constructor() {}

        handle(req, res) {

            //set reference to the handler
            req.handler = new RequestHandler(null, req, res);

            // initialize completion function
            var done = function (err) {
                if (util.isError(err)) {
                    req.handler.serveError(err);
                }
            };

            //create execution loop
            var cnt = 0;
            var execute = function (index) {
                if (index >= Router.middleware.length) {
                    return done();
                }

                //execute the next task
                var sync = true;
                var action = Router.middleware[index].action;
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
            return Router.replaceMiddleware(name, undefined);
        }

        static replaceMiddleware(name, middleware) {
            var index = Router.indexOfMiddleware(name);
            if (index >= 0) {
                Router.middleware.splice(index, 1, middleware);
                return true;
            }
            return false;
        }

        static addMiddlewareAfter(name, middleware) {
            var index = Router.indexOfMiddleware(name);
            if (index >= 0) {
                return Router.addMiddlewareAt(index + 1, middleware);
            }
            return false;
        }

        static addMiddlewareAfterAll(middleware) {
            return Router.addMiddlewareAt(Router.middleware.length, middleware);
        }

        static addMiddlewareBefore(name, middleware) {
            var index = Router.indexOfMiddleware(name);
            if (index >= 0) {
                return Router.addMiddlewareAt(index, middleware);
            }
            return false;
        }

        static addMiddlewareBeforeAll(middleware) {
            return Router.addMiddlewareAt(0, middleware);
        }

        static addMiddlewareAt(index, middleware) {
            Router.middleware.splice(index, 0, middleware);
            return true;
        }

        static indexOfMiddleware(name) {
            for (var i = 0; i < Router.middleware.length; i++) {
                if (Router.middleware[i].name === name) {
                    return i;
                }
            }
            return -1;
        }
    }

    Router.middleware = [];

    return Router;
};
