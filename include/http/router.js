const Koa = require('koa');
const Router = require('koa-router');
const Session = require('../koa/Session')();

module.exports = function (pb) {

    class PencilblueRouter {

        constructor () {
            this.internalMiddlewareStack = [];
            this.app = new Koa();
            this.router = new Router();
            this.internalRouteList = [];
            this.app.use(Session(this.app));
        }

        registerRoute(routeDescriptor) {
            this.internalRouteList.push(routeDescriptor);
        }

        addMiddlewareAfter(name, middleware) {
            let index = this._indexOfMiddleware(name);
            if (index >= 0) {
                return this._addMiddlewareAt(index + 1, middleware);
            }
            return false;
        }
        addMiddlewareAfterAll(middleware) {
            return this._addMiddlewareAt(this.internalMiddlewareStack.length, middleware);
        }

        addMiddlewareBefore(name, middleware) {
            let index = this._indexOfMiddleware(name);
            if (index >= 0) {
                return this._addMiddlewareAt(index, middleware);
            }
            return false;
        }
        addMiddlewareBeforeAll(middleware) {
            return this._addMiddlewareAt(0, middleware);
        }

        /*****
         * Internal Helper Functions
         */
        _addMiddlewareAt(index, middleware) {
            if(this._isValidName(middleware.name)) {
                this.internalMiddlewareStack.splice(index, 0, middleware);
                return true;
            }
            return false;
        }
        _indexOfMiddleware (name) {
            this.internalMiddlewareStack.findIndex(middleware => middleware.name === name);
        }
        _isValidName(name) {
            return this.internalMiddlewareStack
                .filter(middleware => middleware.name === name).length === 0;
        }

        _getMiddlewareListForRoutes () {
            return this.internalMiddlewareStack.map(middleware => middleware.action);
        }
        _loadInMiddleware() {
            this.internalRouteList.forEach(route => {
               this.router[route.descriptor.method](route.descriptor.path, async (ctx, next) => {
                   ctx.routeDescription = route.descriptor;
                   await next();
               }, ...this._getMiddlewareListForRoutes());
            });
        }

        /***
         * Listen function that starts the server
         * @param port
         */
        listen (port) {
            if(!this.calledOnce) {
                this._loadInMiddleware();

                this.app
                    .use(this.router.routes())
                    .use(this.router.allowedMethods())
                    .listen(port);

                pb.log.info("Pencilblue is running...");
                this.calledOnce = 1;
            }
            else {
                pb.log.error(`Listen function was called twice on the same server instance`);
            }
        }
    }

    return PencilblueRouter;
};


