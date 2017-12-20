const _ = require('lodash');
const Promise = require('bluebird');

module.exports = pb => class PluginPersistenceService {
    constructor(logDelegate, dao = null) {
        this.log = this._wrapLog(logDelegate);
        this.dao = dao || Promise.promisifyAll(new pb.DAO());
    }

    /**
     * Persist a plugin to database
     * @param pluginId
     * @param settings
     * @param site
     */
    async persist(pluginId, settings, site) {
        let details = await this._loadDetails(pluginId);
        await this._saveEntry(details, pluginId, site);

        let pluginService = Promise.promisifyAll(new pb.PluginService({site}));
        await this._setPluginSettings(pluginService, details, settings);
        await this._setPluginThemeSettings(pluginService, details);

        await this._invokeOnInstall(pluginId, details, site);

        return true;
    }

    _wrapLog(logDelegate) {
        return message => logDelegate ? logDelegate(message) : null;
    }

    async _loadDetails(pluginId) {
        this.log(`Loading details from plugin service for plugin ${pluginId}`);
        let spec = await pb.PluginService.getPluginSpec(pluginId);
        return spec.details;
    }

    async _saveEntry(details, pluginId, pluginSite) {
        this.log(`Setting system install flags for ${details.uid}`);

        let clone = _.cloneDeep(details);
        clone.dirName = pluginId;

        let pluginDescriptor = pb.DocumentCreator.create('plugin', clone);
        pluginDescriptor.site = pluginSite || pb.SiteService.GLOBAL_SITE;
        return this.dao.saveAsync(pluginDescriptor);
    }

    async _setPluginSettings(pluginService, details, targetSettings) {
        await pluginService.resetSettingsAsync(details);

        if (targetSettings && Object.keys(targetSettings).length > 0) {
            let mappedSettings = details.settings
                .map(setting => {
                    if (targetSettings.hasOwnProperty(setting.name)) {
                        return Object.assign({}, setting, {
                            value: targetSettings[setting.name],
                        });
                    } else {
                        return setting;
                    }
                });
            await pluginService.setSettingsAsync(mappedSettings, details.uid);
        }
    }

    async _setPluginThemeSettings(pluginService, details) {
        if (details.theme && details.theme.settings) {
            this.log(`Adding theme settings for ${details.uid}`);
            await pluginService.resetThemeSettingsAsync(details);
        }
    }

    async _invokeOnInstall(pluginId, details, site) {
        const util = pb.util;
        let mainModule = pb.PluginService.loadMainModule(pluginId, details.main_module.path);
        if (!mainModule) {
            throw new Error(`Failed to load main module ${pluginId} at ${details.main_module.path}`);
        }

        let hasBasicOnInstall = util.isFunction(mainModule.onInstall);
        let hasContextOnInstall = util.isFunction(mainModule.onInstallWithContext);
        if (!util.isNullOrUndefined(mainModule) && (hasBasicOnInstall || hasContextOnInstall)) {
            this.log(`Executing ${details.uid} 'onInstall' function`);

            if (hasBasicOnInstall) {
                return Promise.promisify(mainModule.onInstall).call(mainModule);
            }

            return Promise.promisify(mainModule.onInstallWithContext).call(mainModule, {site: site});
        }
        else {
            this.log(`WARN: Plugin ${details.uid} did not provide an 'onInstall' function.`);
        }
    }
};
