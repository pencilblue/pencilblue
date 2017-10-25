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
                    this._setActive();
                    this._loadRoutes();
                    return this._loadLocalization();
                });
        }

        _setActive() {
            return pb.PluginService.activatePlugin(this.pluginSpec.uid, this.pluginSpec, this.site)
        }

        _onStartupWithContext () {
            const mainModule = this.pluginSpec.mainModule
            if (util.isFunction(mainModule.onStartupWithContext)) {
                return Promise.promisify(mainModule.onStartupWithContext, { context: mainModule })({ site: this.site });
            }
            return Promise.resolve();
        }

        _loadRoutes () {
            this.pluginSpec.controllers.forEach(controller => this._registerRoutesForController(controller));
        }

        _registerRoutesForController (controller) {
            if (!util.isFunction(controller.getRoutes) || !util.isFunction(controller.getRoutesSync)) {
                return Promise.reject(new Error('Controller at [' + controller.path + '] did not return an array of routes'));
            }
        }

        _loadLocalization () {
            const service = new pb.PluginLocalizationLoader({ pluginUid: context.pluginSpec.uid, site: this.site });
            return Promise.promisify(service.getAll, { context: service })();
        }

        // _afterRoutes () { TODO : Implement for other PB users (Not currently used in TN)
        //
        // }
    }

    return SitePluginInitializationService;
};
