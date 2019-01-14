module.exports = (pb) => {
    const path = require('path');
    const _ = require('lodash');
    const pathToRegexp = require('path-to-regexp');

    const coreRoutes =  require(path.join(pb.config.plugins.directory, '/pencilblue/include/routes.js'))(pb);
    class RouteHandler {
        static registerCoreRoutes () {
            RouteHandler.storage = RouteHandler.storage || {};
            coreRoutes.forEach(descriptor => this.registerRoute(descriptor, pb.config.plugins.default));
        }
        static registerRoute(descriptor, plugin) {
            RouteHandler.storage = RouteHandler.storage || {};
            descriptor = this._modifyDescriptor(descriptor);
            this._buildRoute(descriptor, plugin);
        }
        static getRoutesForRouter() {
            return RouteHandler.storage || {};
        }

        static _modifyDescriptor(descriptor) {
            descriptor.method = (descriptor.method || 'ALL').toLowerCase();
            descriptor.controller = pb.util.isString(descriptor.controller) ? require(descriptor.controller)(pb) : descriptor.controller;
            if (descriptor.localization) {
                descriptor.path = `/:locale?${descriptor.path}`.replace(/\/$/, '');
            }
            return descriptor;
        }
        static _buildRoute(descriptor, plugin) {
            const routePath = `['${plugin}']['${descriptor.path}']`;
            let route = _.get(this.storage, routePath);

            if (!route) {
                let pathVars = [];
                let pattern = pathToRegexp(descriptor.path, pathVars);
                route = {
                    pattern,
                    pathVars,
                };
                _.set(this.storage, routePath, route)
            }

            _.set(route, `descriptors['${descriptor.method}']`, Object.freeze(descriptor));

            return route;
        }
    }

    RouteHandler.publicRoutes = ['/js/*', '/css/*', '/fonts/*', '/img/*', '/localization/*', '/favicon.ico', '/docs/*'];
    return RouteHandler;
};
