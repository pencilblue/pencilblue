const Koa = require('koa');
const Router = require('koa-router');
const Session = require('../koa/Session')();
const bodyParser = require('koa-body');
const Cookies  = require('koa-cookie').default;
const Passport = require('../koa/Passport')();


module.exports = function (pb) {

    class PencilblueRouter {

        constructor () {
            this.app = new Koa();
            this.app.keys = ['9011fa34-41a6-4a4d-8ad7-d591c5d3ca01']; // Random GUID
            this.app._requestsServed = this.app._requestsServed || 0;

            this.router = new Router();

            this.app.use(bodyParser({
                multipart: true,
                // formidable: { uploadDir: path.join(__dirname, 'tmp') }
            }));
            let passport = Passport(pb);
            this.app.use(Session(this.app));
            this.app.use(Cookies());
            this.app.use(passport.initialize());
            this.app.use(passport.session());
        }

        static registerRoute(routeDescriptor) {
            this.internalRouteList.push(routeDescriptor);
        }

        static addMiddlewareAfter(name, middleware) {
            let index = this._indexOfMiddleware(name);
            if (index >= 0) {
                return this._addMiddlewareAt(index + 1, middleware);
            }
            return false;
        }
        static addMiddlewareAfterAll(middleware) {
            return this._addMiddlewareAt(this.internalMiddlewareStack.length, middleware);
        }

        static addMiddlewareBefore(name, middleware) {
            let index = this._indexOfMiddleware(name);
            if (index >= 0) {
                return this._addMiddlewareAt(index, middleware);
            }
            return false;
        }
        static addMiddlewareBeforeAll(middleware) {
            return this._addMiddlewareAt(0, middleware);
        }

        static replaceMiddleware(name, middleware) {
            let index = this._indexOfMiddleware(name);
            if(index >= 0 && middleware) {
                this.internalMiddlewareStack[index] = middleware;
            }
        }
        /*****
         * Internal Helper Functions
         */
        static get internalMiddlewareStack () {
            if(this._internalMiddlewareStack)
                return this._internalMiddlewareStack;
            this._internalMiddlewareStack = [];
            return this._internalMiddlewareStack;
        }
        static get internalRouteList () {
            if(this._internalRouteList)
                return this._internalRouteList;
            this._internalRouteList = [];
            return this._internalRouteList;
        }

        static _addMiddlewareAt(index, middleware) {
            if(this._isValidName(middleware.name)) {
                this.internalMiddlewareStack.splice(index, 0, middleware);
                return true;
            }
            return false;
        }
        static _indexOfMiddleware (name) {
            return this.internalMiddlewareStack.findIndex(middleware => middleware.name === name);
        }
        static _getMiddlewareByName (name) {
            return this.internalMiddlewareStack.find(middleware => middleware.name === name);
        }
        static _isValidName(name) {
            return this.internalMiddlewareStack
                .filter(middleware => middleware.name === name).length === 0;
        }

        static _getMiddlewareListForRoutes () {
            return this.internalMiddlewareStack.map(middleware => middleware.action);
        }

        _loadInMiddleware() {
            PencilblueRouter.internalRouteList.forEach(route => {
                Object.keys(route.descriptors).forEach(method => {
                    let routeDescriptor = route.descriptors[method];
                    this.router[method](routeDescriptor.path, async (ctx, next) => {
                        this.app._requestsServed++;
                        ctx.routeDescription = routeDescriptor;
                        await next();
                    }, ...PencilblueRouter._getMiddlewareListForRoutes());
                });
            });
        }
        _loadPublicRoutes () {
            let routeParserMiddleware = PencilblueRouter._getMiddlewareByName('parseUrl');
            let publicRouteHandlerMiddleware = PencilblueRouter._getMiddlewareByName('checkPublicRoute');
            let mimeTypeMiddleware = PencilblueRouter._getMiddlewareByName('setMimeType');
            pb.RouterLoader.publicRoutes.forEach(route => {
                this.router.get(route, routeParserMiddleware.action, mimeTypeMiddleware.action, publicRouteHandlerMiddleware.action);
            });

            let nodeModuleMiddleware = PencilblueRouter._getMiddlewareByName('checkModuleRoute');
            this.router.get('/node_modules/*', routeParserMiddleware.action, mimeTypeMiddleware.action, nodeModuleMiddleware.action);
        }
        _addDefaultMiddleware() {
            // Add middleware stack for those routes that are unknown
            this.app.use(async(ctx, next) => {
                this.app._requestsServed++;
                await next();
            });
            PencilblueRouter._getMiddlewareListForRoutes()
                .forEach(middleware => this.app.use(middleware));
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
                    .use(this.router.allowedMethods());

                this._addDefaultMiddleware();

                this.__server = this.app.listen(port, () => {
                    pb.log.info('PencilBlue is ready!');
                });

                this.calledOnce = 1;
            }
            else {
                pb.log.error(`Listen function was called twice on the same server instance`);
            }
        }
        get requestsServed () {
            return this.app._requestsServed;
        }
    }

    return PencilblueRouter;
};


