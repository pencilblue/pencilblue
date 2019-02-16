'use strict';

//dependencies
var url = require('url');
var util = require('util');
var domain = require('domain');

module.exports = function (pb) {

    //pb dependencies
    var RequestHandler = pb.RequestHandler;

    /**
     * Responsible for routing a request through the registered middleware to serve up a response
     * @class Router
     * @constructor
     * @param {Request} req
     * @param {Response} res
     */
    class Router {
        constructor(req, res) {

            /**
             * Represents the current position of the middleware that is currently executing
             * @property index
             * @type {number}
             */
            this.index = 0;

            /**
             * @property req
             * @type {Request}
             */
            this.req = req;

            /**
             * @property res
             * @type {Response}
             */
            this.res = res;
        }

        /**
         * Starts the execution of the middleware pipeline against the specified request/response pair
         * @method handle
         */
        handle() {

            //set reference to the handler
            this.req.handler = new RequestHandler(this.req, this.res);
            this.req.router = this;

            return this._handle(this.req, this.res).catch((err) => {
                this.res.statusCode = 500;
                this.res.end();
            });
        }

        _handleMiddleware(req, res, action) {
            return new Promise((resolve, reject) => {
                process.nextTick(() => {
                    try {
                        action(req, res, (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        }

        async _handleMiddlewares (req, res) {
            try {
                for (; this.index < Router.middleware.length; this.index++) {
                    await this._handleMiddleware(req, res, Router.middleware[this.index].action);
                }
            } catch (e) {
                return new Promise((resolve, reject) => {
                    req.handler.serveError(e, {
                        handler: (data) => {
                            req.controllerResult = data;
                            this.continueAfter('render')
                                .then(resolve, reject);
                        }
                    });
                });
            }
        }

        /**
         * Handles the incoming request by executing each of the middleware in the pipeline
         * @private
         * @method _handle
         * @param {Request} req
         * @param {Response} res
         */
        _handle (req, res) {
            return this._handleMiddlewares(req, res);
        }

        /**
         * Instructs the router to continue pipeline execution after the specified middleware.
         * @method continueAfter
         * @param {string} middlewareName
         */
        continueAfter (middlewareName) {
            var index = Router.indexOfMiddleware(middlewareName);
            return this.continueAt(index + 1);
        }

        /**
         * Instructs the router to continue processing at the specified position in the set of middleware being executed
         * @method continueAt
         * @param {number} index
         */
        continueAt (index) {
            this.index = index;
            return this._handle(this.req, this.res);
        }

        /**
         * Causes a redirect result to be created and set off of the Request object as the controllerResult.
         * The pipeline is then instructed to continue after the "render" middleware
         * @static
         * @method redirect
         * @param {string} location The location to redirect to
         * @param {number} httpStatusCode The integer that represents the status code to be returned
         */
        redirect (location, httpStatusCode) {
            this.req.controllerResult = {
                redirect: location,
                code: httpStatusCode
            };
            return this.continueAfter('render');
        }

        /**
         * Removes the specified middleware from the pipeline
         * @static
         * @method removeMiddleware
         * @param {string} name
         * @returns {boolean}
         */
        static removeMiddleware(name) {
            var index = Router.indexOfMiddleware(name);
            if (index >= 0) {
                Router.middleware.splice(index, 1);
                return true;
            }
            return false;
        }

        /**
         * Replaces the middleware with the specified name at its current position in the middleware pipeline
         * @static
         * @method replaceMiddleware
         * @param {string} name
         * @param {object} middleware
         * @param {string} middleware.name
         * @param {function} middleware.action
         * @returns {boolean}
         */
        static replaceMiddleware(name, middleware) {
            var index = Router.indexOfMiddleware(name);
            if (index >= 0) {
                Router.middleware.splice(index, 1, middleware);
                return true;
            }
            return false;
        }

        /**
         * Adds middleware after the middleware with the specified name
         * @static
         * @method addMiddlewareAfter
         * @param {string} name
         * @param {object} middleware
         * @param {string} middleware.name
         * @param {function} middleware.action
         * @returns {boolean}
         */
        static addMiddlewareAfter(name, middleware) {
            var index = Router.indexOfMiddleware(name);
            if (index >= 0) {
                return Router.addMiddlewareAt(index + 1, middleware);
            }
            return false;
        }

        /**
         * Adds middleware after all other registered middleware
         * @static
         * @method addMiddlewareAfterAll
         * @param {object} middleware
         * @param {string} middleware.name
         * @param {function} middleware.action
         * @returns {boolean}
         */
        static addMiddlewareAfterAll(middleware) {
            return Router.addMiddlewareAt(Router.middleware.length, middleware);
        }

        /**
         * Adds middleware before the middleware with the specified name
         * @static
         * @method addMiddlewareBefore
         * @param {string} name
         * @param {object} middleware
         * @param {string} middleware.name
         * @param {function} middleware.action
         * @returns {boolean}
         */
        static addMiddlewareBefore(name, middleware) {
            var index = Router.indexOfMiddleware(name);
            if (index >= 0) {
                return Router.addMiddlewareAt(index, middleware);
            }
            return false;
        }

        /**
         * Adds middleware before all other registered middleware
         * @static
         * @method addMiddlewareBeforeAll
         * @param {object} middleware
         * @param {string} middleware.name
         * @param {function} middleware.action
         * @returns {boolean}
         */
        static addMiddlewareBeforeAll(middleware) {
            return Router.addMiddlewareAt(0, middleware);
        }

        /**
         * Adds middleware at the specified index
         * @static
         * @method addMiddlewareAt
         * @param {number} index
         * @param {object} middleware
         * @param {string} middleware.name
         * @param {function} middleware.action
         * @returns {boolean} TRUE if added, FALSE if the middleware already exists in the pipeline
         */
        static addMiddlewareAt(index, middleware) {//TODO add check to ensure you can't add middleware with the same name, valid name, valid action
            Router.middleware.splice(index, 0, middleware);
            return true;
        }

        /**
         * Determines the position in the middleware pipeline where the middleware executes.
         * @static
         * @method indexOfMiddleware
         * @param {string} name
         * @returns {number} The position of the middleware or -1 when not found
         */
        static indexOfMiddleware(name) {
            for (var i = 0; i < Router.middleware.length; i++) {
                if (Router.middleware[i].name === name) {
                    return i;
                }
            }
            return -1;
        }
    }

    /**
     * @static
     * @property middleware
     * @type {Array}
     */
    Router.middleware = [];

    return Router;
};
