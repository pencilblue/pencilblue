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

        _syncSettings () {
            const syncService = new pb.PluginService({ site: this.site });
            return Promise.promisify(syncService.syncSettings, {context: syncService})(this.pluginSpec, this.pluginSpec.details)
                .catch(err => pb.log.warn(`SitePluginInitializationService: Failed to sync settings: ${err.stack}`));
        }
    }

    return SitePluginInitializationService;
};
