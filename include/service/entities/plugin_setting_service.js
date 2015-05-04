var util = require('../../util.js');


module.exports = function PluginSettingServiceModule(pb) {

	var GLOBAL_SITE = pb.SiteService.GLOBAL_SITE;

	function PluginSettingService(siteUID){
		//construct settings services
        this.caching = pb.config.plugins.caching;

        if(pb.config.multisite && siteUID) {
            this.site = siteUID;
        } else {
            this.site = GLOBAL_SITE;
        }

        this.pluginService = new pb.PluginService(this.site);

        /**
         * A setting service that sets and retrieves the settings for plugins
         * @property pluginSettingsService
         * @type {SimpleLayeredService}
         */
        this.pluginSettingsService = genSettingsService('plugin_settings', this.caching.useMemory, this.caching.useCache, 'PluginSettingService', this.site);

        /**
         * A setting service that sets and retrieves the settings for plugins
         * @property pluginSettingsService
         * @type {SimpleLayeredService}
         */
        this.themeSettingsService  = genSettingsService('theme_settings', this.caching.useMemory, this.caching.useCache, 'ThemeSettingService', this.site);
	}

	/**
     * Retrieves a single setting for the specified plugin.
     *
     * @method getSetting
     * @param {string} settingName The name of the setting to retrieve
     * @param {string} pluginName The name of the plugin who owns the setting
     * @param {function} cb A callback that provides two parameters: cb(error, settingValue).
     * Null is returned if the setting does not exist or the specified plugin is not
     * installed.
     */
    PluginSettingService.prototype.getSetting = function(settingName, pluginName, cb) {
        this.getSettings(pluginName, function(err, settings) {
            if (util.isError(err)) {
                cb(err, null);
                return;
            }

            var val = null;
            if (util.isArray(settings)) {
                for (var i = 0; i < settings.length; i++) {
                    if (settingName === settings[i].name) {
                        val = settings[i].value;
                        break;
                    }
                }
            }
            cb(err, val);
        });
    };

    /**
     * Retrieves all of the settings for the specfied plugin.
     *
     * @method getSettings
     * @param pluginName The name of the plugin who's settings are being requested
     * @param cb A callback that provides two parameters: cb(error, settings).
     * Null is provided in the event that the plugin is not installed.
     */
    PluginSettingService.prototype.getSettings = function(pluginName, cb) {
        this.pluginSettingsService.get(pluginName, cb);
    };

    PluginSettingService.prototype.getSettingsBySite = function(pluginName, cb) {
    	var settings = getAdminPluginSettingsService(this);
    	settings.get(pluginName, cb);
    }

    /**
     * Retrieves the settings for a plugin as hash of key/value pairs.  This 
     * differs from the getSettings function because the getSettings function 
     * provides the settings in their raw form as an array of objects containing 
     * multiple properties.  In most circumstances just the k/v pair is needed and 
     * not any additional information about the property.  The function takes the 
     * raw settings array and transforms it into an object where the setting name 
     * is the property and the setting value is the value.
     * @method getSettingsKV
     * @param {String} pluginName The unique ID of the plugin who settings are to be retrieved
     * @param {Function} cb A callback that takes two parameters.  A error, if 
     * exists, and a hash of of the plugin's settings' names/values.
     */
    PluginSettingService.prototype.getSettingsKV = function(pluginName, cb) {
        this.pluginSettingsService.get(pluginName, function(err, settings) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (!util.isArray(settings)) {
                return cb(null, null);
            }

            cb(null, util.arrayToObj(settings, 'name', 'value'));
        });
    };

    /**
     * Replaces a single setting for the specified plugin
     *
     * @method setSetting
     * @param name The name of the setting to change
     * @param value The new value for the setting
     * @param pluginName The plugin who's setting is being changed.
     * @param cb A callback that provides two parameters: cb(error, TRUE/FALSE).
     * TRUE if the setting was persisted successfully, FALSE if not.
     */
    PluginSettingService.prototype.setSetting = function(name, value, pluginName, cb) {
        var self = this;

        //error checking
        if (!pb.PluginService.validateSettingValue(value)) {
            cb(new Error("PluginService: The setting value is required when modifing a theme setting"), false);
        }
        if (!pb.validation.validateNonEmptyStr(name, true)) {
            cb(new Error("PluginService: The setting name is required when modifing a theme setting"), false);
        }

        //retrieve the settings to modify
        this.getSettingsBySite(pluginName, function(err, settings) {
            if (util.isError(err) || !settings) {
                cb(err, false);
                return;
            }

            var wasFound = false;
            for (var i = 0; i < settings.length; i++) {
                if (name === settings[i].name) {
                    settings[i].value = value;
                    wasFound = true;
                    break;
                }
            }
            if (!wasFound) {
                settings.push({
                    name: name,
                    value: value
                });
            }
            self.setSettings(settings, pluginName, cb);
        });
    };

    /**
     * Replaces the settings for the specified plugin.
     *
     * @method setSettings
     * @param settings The settings object to be validated and persisted
     * @param pluginName The name of the plugin who's settings are being represented
     * @param cb A callback that provides two parameters: cb(error, TRUE/FALSE).
     * TRUE if the settings were persisted successfully, FALSE if not.
     */
    PluginSettingService.prototype.setSettings = function(settings, pluginName, cb) {
        var self = this;

        //error checking
        if (!settings) {
            cb(new Error("PluginSettingService: The settings object is required when making changes to plugin settings"), false);
            return;
        }
        if (!pluginName) {
            cb(new Error("PluginSettingService: The plugin name is required when making changes to plugin settings"), false);
            return;
        }

        this.pluginService.isInstalled(pluginName, function(err, isInstalled) {
            if (util.isError(err) || !isInstalled) {
                cb(err, false);
                return;
            }

            self.pluginSettingsService.set(pluginName, settings, function(err, result) {
                cb(err, !util.isError(err) && result);
            });
        });
    };

    /**
     * Replaces a single theme setting for the specified plugin
     *
     * @method setThemeSetting
     * @param name The name of the setting to change
     * @param value The new value for the setting
     * @param pluginName The plugin who's setting is being changed.
     * @param cb A callback that provides two parameters: cb(error, TRUE/FALSE).
     * TRUE if the setting was persisted successfully, FALSE if not.
     */
    PluginSettingService.prototype.setThemeSetting = function(name, value, pluginName, cb) {
        var self = this;

        //error checking
        if (!pb.PluginService.validateSettingValue(value)) {
            cb(new Error("PluginService: The setting value is required when modifing a theme setting"), false);
        }
        if (!pb.validation.validateNonEmptyStr(name, true)) {
            cb(new Error("PluginService: The setting name is required when modifing a theme setting"), false);
        }

        //retrieve the settings to modify
        this.getThemeSettingsBySite(pluginName, function(err, settings) {
            if (util.isError(err) || !settings) {
                cb(err, false);
                return;
            }

            var wasFound = false;
            for (var i = 0; i < settings.length; i++) {
                if (name === settings[i].name) {
                    settings[i].value = value;
                    wasFound = true;
                    break;
                }
            }
            if (!wasFound) {
                settings.push({
                    name: name,
                    value: value
                });
            }
            self.setThemeSettings(settings, pluginName, cb);
        });
    };

    /**
     * Replaces the theme settings for the specified plugin.
     *
     * @method setThemeSettings
     * @param settings The settings object to be validated and persisted
     * @param pluginName The uid of the plugin who's settings are being represented
     * @param cb A callback that provides two parameters: cb(error, TRUE/FALSE).
     * TRUE if the settings were persisted successfully, FALSE if not.
     */
    PluginSettingService.prototype.setThemeSettings = function(settings, pluginName, cb) {
        var self = this;

        //error checking
        if (!settings) {
            cb(new Error("PluginSettingService: The settings object is required when making changes to theme settings"), false);
            return;
        }
        if (!pluginName) {
            cb(new Error("PluginSettingService: The plugin name is required when making changes to theme settings"), false);
            return;
        }

        this.pluginService.isInstalled(pluginName, function(err, isInstalled) {
            if (util.isError(err) || !isInstalled) {
                cb(err, false);
                return;
            }

            self.themeSettingsService.set(pluginName, settings, function(err, result) {
                cb(err, !util.isError(err) && result);
            });
        });
    };

    /**
     * Retrieves a single theme setting value.
     *
     * @method getThemeSetting
     * @param settingName The uid of the setting
     * @param pluginName The plugin to retrieve the setting from
     * @param cb A callback that provides two parameters: cb(error, settingValue)
     */
    PluginSettingService.prototype.getThemeSetting = function(settingName, pluginName, cb) {
        this.getThemeSettings(pluginName, function(err, settings) {
            if (util.isError(err)) {
                cb(err, null);
                return;
            }

            var val = null;
            if (util.isArray(settings)) {
                for (var i = 0; i < settings.length; i++) {
                    if (settingName === settings[i].name) {
                        val = settings[i].value;
                        break;
                    }
                }
            }
            cb(err, val);
        });
    };

    /**
     * Retrieves the theme settings for the specified plugin
     *
     * @method getThemeSettings
     * @param pluginName The uid of the plugin
     * @param cb A callback that provides two parameters: cb(err, settingsObject)
     */
    PluginSettingService.prototype.getThemeSettings = function(pluginName, cb) {
        this.themeSettingsService.get(pluginName, cb);
    };

    PluginSettingService.prototype.getThemeSettingsBySite = function(pluginName, cb) {
    	var settings = getAdminThemeSettingsService(this);
    	settings.get(pluginName, cb);
    }

    /**
     * Retrieves the theme settings for a plugin as hash of key/value pairs.  This 
     * differs from the getThemeSettings function because the getThemeSettings function 
     * provides the settings in their raw form as an array of objects containing 
     * multiple properties.  In most circumstances just the k/v pair is needed and 
     * not any additional information about the property.  The function takes the 
     * raw settings array and transforms it into an object where the setting name 
     * is the property and the setting value is the value.
     * @method getThemeSettingsKV
     * @param {String} pluginName The unique ID of the plugin who settings are to be retrieved
     * @param {Function} cb A callback that takes two parameters.  A error, if 
     * exists, and a hash of of the plugin's settings' names/values.
     */
    PluginSettingService.prototype.getThemeSettingsKV = function(pluginName, cb) {
        this.themeSettingsService.get(pluginName, function(err, settings) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (!util.isArray(settings)) {
                return cb(null, null);
            }

            cb(null, util.arrayToObj(settings, 'name', 'value'));
        });
    };


    /**
     * Loads the settings from a details object and persists them in the DB.  Any
     * existing settings for the plugin are deleted before the new settings are
     * persisted.
     *
     * @method resetSettings
     * @param details The details object to extract the settings from
     * @param cb A callback that provides two parameters: cb(error, TRUE/FALSE).
     * TRUE if the settings were successfully cleared and reloaded. FALSE if not.
     */
    PluginSettingService.prototype.resetSettings = function(details, cb) {
        var self = this;

        //retrieve plugin to prove it exists (plus we need the id)
        var pluginName = details.uid;
        this.pluginService.getPluginBySite(pluginName, function(err, plugin) {
            if (util.isError(err) || !plugin) {
                return cb(err ? err : new Error("The plugin "+pluginName+" is not installed"), false);
            }

            //remove any existing settings
            self.pluginSettingsService.purge(pluginName, function (err, result) {
                if (util.isError(err) || !result) {
                    return cb(err, false);
                }

                //build the object to persist
                var baseDoc  = {
                    plugin_name: plugin.name,
                    plugin_uid: plugin.uid,
                    plugin_id: plugin[pb.DAO.getIdField()].toString(),
                    settings: details.settings
                };
                var settings = pb.DocumentCreator.create('plugin_settings', baseDoc);

                //save it
                var dao      = new pb.DAO();
                dao.save(settings, function(err, result) {
                    cb(err, !util.isError(err));
                });
            });
        });
    };

    /**
     * Loads the Theme settings from a details object and persists them in the DB.  Any
     * existing theme settings for the plugin are deleted before the new settings
     * are persisted. If the plugin does not have a theme then false is provided in
     * the callback.
     *
     * @method resetThemeSettings
     * @param details The details object to extract the settings from
     * @param cb A callback that provides two parameters: cb(error, TRUE/FALSE).
     * TRUE if the settings were successfully cleared and reloaded. FALSE if not.
     */
    PluginSettingService.prototype.resetThemeSettings = function(details, cb) {
        var self = this;

        //error checking
        var pluginName = details.uid;
        if (!details.theme || !details.theme.settings) {
            cb(new Error("PluginService: Settings are required when attempting to reset a plugin's theme settings"), false);
            return;
        }

        //retrieve plugin to prove it exists (plus we need the id)
        this.pluginService.getPluginBySite(pluginName, function(err, plugin) {
            if (util.isError(err) || !plugin) {
                cb(err, false);
                return;
            }

            //remove any existing settings
            self.themeSettingsService.purge(pluginName, function (err, result) {
                if (util.isError(err) || !result) {
                    cb(err, false);
                    return;
                }

                //build the object to persist
                var baseDoc  = {
                    plugin_name: plugin.name,
                    plugin_uid: plugin.uid,
                    plugin_id: plugin[pb.DAO.getIdField()].toString(),
                    settings: details.theme.settings
                };
                var settings = pb.DocumentCreator.create('theme_settings', baseDoc);

                //save it
                var dao      = new pb.DAO();
                dao.save(settings, function(err, result) {
                    cb(err, !util.isError(err));
                });
            });
        });
    };

    PluginSettingService.prototype.purgePluginSettings = function(pluginUid, cb) {
        this.pluginSettingsService.purge(pluginUid, cb);
    };

    PluginSettingService.prototype.purgeThemeSettings = function(pluginUid, cb) {
        this.themeSettingsService.purge(pluginUid, cb);
    };


    /**
     * Convenience function to generate a service to handle settings for a plugin.
     *
     * @static
     * @method genSettingsService
     * @param objType The type of object that will be dealt with.  (plugin_settings,
     * theme_settings)
     * @param useMemory {Boolean} Indicates if the generated layered service should
     * use an in memory service.
     * @param useCache {Boolean} Indicates if the generated layered service should
     * use a cache service.
     * @param serviceName The name of the service
     * @return {SimpleLayeredService}
     */
    function genSettingsService(objType, useMemory, useCache, serviceName, site, onlyThisSite) {

        //add in-memory service
        var services = [];
        if (useMemory){
            var options = {
                objType: objType,
                timeout: pb.config.plugins.caching.memory_timeout,
                site: site,
                onlyThisSite: onlyThisSite
            };
            services.push(new pb.MemoryEntityService(options));
        }

        //add cache service
        if (useCache) {
            services.push(new pb.CacheEntityService(objType, null, null, site, onlyThisSite));
        }

        //always add DB
        services.push(new pb.DBEntityService(objType, 'settings', 'plugin_uid', site, onlyThisSite));
        return new pb.SimpleLayeredService(services, serviceName);
    };

    function getAdminPluginSettingsService(self) {
    	if(!self.adminPluginSettingsService) {
    		self.adminPluginSettingsService = genSettingsService('plugin_settings', this.caching.useMemory, this.caching.useCache, 'PluginSettingService', this.site, true);
    	}
    	return self.adminPluginSettingsService;
    }

    function getAdminThemeSettingsService(self) {
    	if(!self.adminThemeSettingsService) {
    		self.adminThemeSettingsService = genSettingsService('theme_settings', this.caching.useMemory, this.caching.useCache, 'ThemeSettingService', this.site);
    	}
    	return self.adminThemeSettingsService;
    }
	return PluginSettingService;
}