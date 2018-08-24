module.exports = (pb) => {
    const path = require('path');
    const _ = require('lodash');
    const pathToRegexp = require('path-to-regexp');

    class RouteHandler {
        constructor () {
            this.coreRoutes = require(path.join(pb.config.plugins.directory, '/pencilblue/include/routes.js'))(pb);
            this.storage = {};
        }

        getCoreRouteList (router) {
            this.coreRoutes.forEach(descriptor => this.registerRoute(router, descriptor, pb.config.plugins.default));
        }
        registerRoute(router, descriptor, plugin) {
            descriptor = this._modifyDescriptor(descriptor);
            let route = this._buildRoute(descriptor, plugin);
            router.registerRoute(route);
        }

        _modifyDescriptor(descriptor) {
            descriptor.method = (descriptor.method || 'ALL').toLowerCase();
            descriptor.controller = pb.util.isString(descriptor.controller) ? require(descriptor.controller)(pb) : descriptor.controller;
            if (descriptor.localization) {
                descriptor.path = `/:locale?${descriptor.path}`.replace(/\/$/, '');
            }
            return descriptor;
        }
        _buildRoute(descriptor, plugin) {
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

            route.descriptor = Object.freeze(descriptor);

            return route;
        }

    }

    return RouteHandler;
};
