const Koa = require('koa');
const Router = require('koa-router');
const Session = require('../koa/Session')();
const bodyParser = require('koa-bodyparser');


module.exports = function (pb) {

    class PencilblueRouter {

        constructor () {
            this.internalMiddlewareStack = [];
            this.app = new Koa();
            this.app.keys = ['9011fa34-41a6-4a4d-8ad7-d591c5d3ca01']; // Random GUID

            this.router = new Router();
            this.internalRouteList = [];

            this.app.use(bodyParser());
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
            return this.internalMiddlewareStack.findIndex(middleware => middleware.name === name);
        }
        _getMiddlewareByName (name) {
            return this.internalMiddlewareStack.find(middleware => middleware.name === name);
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
                Object.keys(route.descriptors).forEach(method => {
                    let routeDescriptor = route.descriptors[method];
                    this.router[method](routeDescriptor.path, async (ctx, next) => {
                        ctx.routeDescription = routeDescriptor;
                        ctx.serve404 = () => {
                            ctx.status = 404;
                            ctx.body = 'Page not found on PB';
                        };
                        ctx.serve403 = () => {
                            ctx.status = 403;
                            ctx.body = '403 Forbidden';
                        };
                        await next();
                    }, ...this._getMiddlewareListForRoutes());
                });
            });
        }
        _loadPublicRoutes () {
            let routeParserMiddleware = this._getMiddlewareByName('parseUrl');
            let publicRouteHandlerMiddleware = this._getMiddlewareByName('checkPublicRoute');
            let mimeTypeMiddleware = this._getMiddlewareByName('setMimeType');
            pb.RouterLoader.publicRoutes.forEach(route => {
                this.router.get(route, routeParserMiddleware.action, mimeTypeMiddleware.action, publicRouteHandlerMiddleware.action);
            });

            let nodeModuleMiddleware = this._getMiddlewareByName('checkModuleRoute');
            this.router.get('/node_modules/*', routeParserMiddleware.action, mimeTypeMiddleware.action, nodeModuleMiddleware.action);
        }

        /***
         * Listen function that starts the server
         * @param port
         */
        listen (port) {
            if(!this.calledOnce) {
                this._loadPublicRoutes(); // Loads PB public routes, not regular public routes. -- Need to remove eventually
                this._loadInMiddleware();

                this.app
                    .use(this.router.routes())
                    .use(this.router.allowedMethods())
                    .listen(port);

                pb.log.info('PencilBlue is ready!');
                console.timeEnd("startup");
                this.calledOnce = 1;
            }
            else {
                pb.log.error(`Listen function was called twice on the same server instance`);
            }
        }
    }

    return PencilblueRouter;
};


