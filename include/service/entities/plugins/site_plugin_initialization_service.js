const Promise = require('bluebird');

module.exports = (pb) => {
    const util = pb.util;
    class SitePluginInitializationService {
        constructor (pluginSpec, site) {
            this.pluginSpec = pluginSpec;
            this.site = site;
        }

        initialize() {
            return this._onStartupWithContext()
                .then(_ => {
                    this._loadLocalization().then(_ => {
                        this._loadRoutes();
                        return this._setActive();
                    });
                });
        }

        _setActive() {
            return pb.PluginService.activatePlugin(this.pluginSpec.uid, this.pluginSpec, this.site)
        }

        _onStartupWithContext () {
            const mainModule = this.pluginSpec.main_module
            if (util.isFunction(mainModule.onStartupWithContext)) {
                return Promise.promisify(mainModule.onStartupWithContext, { context: mainModule })({ site: this.site });
            }
            return Promise.resolve();
        }

        _loadRoutes () {
            Object.keys(this.pluginSpec.controllers).forEach(key => { this._registerRoutesForController(key, this.pluginSpec.controllers[key]) });
        }

        _registerRoutesForController (path, controller) {
            if (!controller.getRoutes && !controller.getRoutesSync) {
                return Promise.reject(new Error('Controller at [' + path + '] did not return an array of routes'));
            }


            const routesHandler = routes => {
                if (routes) {
                    routes.forEach(route => {
                        route.controller = path;
                        pb.RequestHandler.registerRoute(route, this.pluginSpec.uid, this.site);
                    });
                }
            };

            controller.getRoutes((err, routes) => routesHandler(routes));

        }

        _loadLocalization () {
            const service = new pb.PluginLocalizationLoader({ pluginUid: this.pluginSpec.uid, site: this.site });
            return Promise.promisify(service.getAll, { context: service })({register: true});
        }

        // _afterRoutes () { TODO : Implement for other PB users (Not currently used in TN)
        //
        // }
    }

    return SitePluginInitializationService;
};
