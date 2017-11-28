const Promise = require('bluebird');

module.exports = (pb) => {
    const util = pb.util;
    class SitePluginInitializationService {
        constructor (pluginSpec, site) {
            this.pluginSpec = pluginSpec;
            this.site = site;
        }

        initialize() {
            return Promise.all([
                this._onStartupWithContext(),
                this._loadRoutes(),
                this._syncSettings(),
                this._setActive()
            ]);
        }

        _setActive() {
            return pb.PluginService.activatePlugin(this.pluginSpec.uid, this.pluginSpec, this.site)
        }

        _onStartupWithContext () {
            const mainModule = this.pluginSpec.main_module;
            if (util.isFunction(mainModule.onStartupWithContext)) {
                return Promise.promisify(mainModule.onStartupWithContext, { context: mainModule })({ site: this.site });
            }
            return Promise.resolve();
        }

        _loadRoutes () {
            Object.keys(this.pluginSpec.controllers).forEach(key => { this._registerRoutesForController(this.pluginSpec.controllers[key]) });
            const mainModule = this.pluginSpec.main_module;
            if (util.isFunction(mainModule.onAfterRoutesLoadedWithContext)) {
                return Promise.promisify(mainModule.onAfterRoutesLoadedWithContext, { context: mainModule })({ site: this.site });
            }
            return Promise.resolve();
        }

        _registerRoutesForController (controller) {
            if (!controller.getRoutes) {
                return Promise.reject(new Error('Controller [' + controller.name + '] did not return an array of routes'));
            }

            const routesHandler = routes => {
                if (routes) {
                    routes.forEach(route => {
                        route.controller = controller;
                        pb.RequestHandler.registerRoute(route, this.pluginSpec.uid, this.site);
                    });
                }
            };

            controller.getRoutes((err, routes) => routesHandler(routes));

        }

        _syncSettings () {
            const syncService = new pb.PluginService({ site: this.site });
            return Promise.promisify(syncService.syncSettings, {context: syncService})(this.pluginSpec, this.pluginSpec.details)
                .catch(err => pb.log.warn(`SitePluginInitializationService: Failed to sync settings: ${err.stack}`));
        }
    }

    return SitePluginInitializationService;
};