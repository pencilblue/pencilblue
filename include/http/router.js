'use strict';

//dependencies
var url = require('url');
var util = require('util');

module.exports = function (pb) {

    //pb dependencies
    var RequestHandler = pb.RequestHandler;

    class Router {
        constructor(req, res) {

            this.index = 0;

            this.req = req;

            this.res = res;
        }

        handle() {

            //set reference to the handler
            this.req.handler = new RequestHandler(null, this.req, this.res);
            this.req.router = this;

            this._handle(this.req, this.res);
        }

        _handle (req, res) {
            // initialize completion function
            var self = this;
            var done = function (err) {
                if (util.isError(err)) {
                    req.handler.serveError(err, { handler: function(data) {
                        req.controllerResult = data;
                        self.continueAfter('render');
                    }});
                }
            };

            //create execution loop
            var execute = function () {
                if (self.index >= Router.middleware.length) {
                    return done();
                }
console.log(Router.middleware[self.index].name);
                //execute the next task
                var sync = true;
                var action = Router.middleware[self.index].action;
                action(req, res, function (err) {
                    if (err) {
                        return done(err);
                    }

                    // delay by a tick when reaching here synchronously otherwise just proceed
                    self.index++;
                    if (sync) {
                        process.nextTick(function() {
                            execute();
                        });
                    }
                    else {
                        execute();
                    }
                });
                sync = false;
            };
            execute();
        }

        continueAfter (middlewareName) {
            var index = Router.indexOfMiddleware(middlewareName);
            this.continueAt(index + 1);
        }

        continueAt (index) {
            this.index = index;
            this._handle(this.req, this.res);
        }

        redirect (location, httpStatusCode) {
            this.req.controllerResult = {
                location: location,
                code: httpStatusCode
            };
            this.continueAfter('render');
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
