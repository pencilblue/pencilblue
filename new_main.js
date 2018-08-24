
    const Promise = require('bluebird');
    const Configuration = require('./include/config.js');

    const pb = createPencilblueInstance(Configuration.load());
    const RouteLoader = require('./include/koa/RouteHandler')(pb);


    function createPencilblueInstance(config) {
        let pb = require('./include')(config);
        Object.keys(pb).forEach((key) => pb[key] = Promise.promisifyAll(pb[key]));
        return pb;
    }


    class Pencilblue {
        constructor () {
            this.router = new pb.Router();
        }
        async startup () {
            // Setup Routing and Middleware
            this._initMiddleware();
            this._initCoreRoutes();

            this.router.listen(3000);
        }

        _initMiddleware () {
            return pb.Middleware.getAll()
                .forEach((middleware) => this.router.addMiddlewareAfterAll(middleware));
        }
        _initCoreRoutes () {
            let routeLoader = new RouteLoader();
            routeLoader.getCoreRouteList(this.router);
        }

    }
    new Pencilblue().startup();


