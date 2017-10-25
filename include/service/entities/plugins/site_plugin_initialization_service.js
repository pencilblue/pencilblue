const Promise = require('bluebird');

module.exports = (pb) => {
    const util = pb.util;
    class SitePluginInitializationService {
        constructor (pluginSpec, site) {
            this.pluginSpec = pluginSpec;
            this.site = site;
        }

        initialize() {
            const tasks = [
                this._onStartupWithContext,
                this._setActive,
                this._loadRoutes,
                this._loadLocalization
            ];

            return Promise.reduce(tasks, task => task.bind(this)()).then(_ => this.pluginSpec);
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
            this.pluginSpec.controllers.forEach(this._registerRoutesForController);
        }

        _registerRoutesForController (controller) {
            if (!util.isFunction(controller.getRoutes)) {
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
