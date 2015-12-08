var util = require('../../util.js');


module.exports = function PluginSettingServiceModule(pb) {

    /**
     * @private
     * @static
     * @readonly
     * @property GLOBAL_SITE
     * @type {String}
     */
    var GLOBAL_SITE = pb.SiteService.GLOBAL_SITE;
    
    /**
     * @private
     * @static
     * @readonly
     * @property SITE_FIELD
     * @type {String}
     */
    var SITE_FIELD = pb.SiteService.SITE_FIELD;

    /**
     * Constructor for service that retrieves plugin settings from the database.
     * @param {String} siteUID - site unique id
     * @constructor
     */
    function PluginSettingService(siteUID){
		//construct settings services
        
        /**
         *
         * @property caching
         * @type {Object}
         */
        this.caching = pb.config.plugins.caching;
        
        /**
         *
         * @property site
         * @type {String}
         */
        this.site = pb.config.multisite.enabled && siteUID ? siteUID : GLOBAL_SITE;

        /**
         *
         * @property pluginService
         * @type {PluginService}
         */
        this.pluginService = new pb.PluginService({site: this.site});

        /**
         * A setting service that sets and retrieves the settings for plugins
         * @property pluginSettingsService
         * @type {SimpleLayeredService}
         */
        this.pluginSettingsService = genSettingsService({
            objType: 'plugin_settings', 
            useMemory: this.caching.useMemory, 
            useCache: this.caching.useCache, 
            serviceName: 'PluginSettingService', 
            site: this.site, 
            onlyThisSite: false
        });

        /**
         * A setting service that sets and retrieves the settings for plugins
         * @property pluginSettingsService
         * @type {SimpleLayeredService}
         */
        this.themeSettingsService  = genSettingsService({
            objType: 'theme_settings', 
            useMemory: this.caching.useMemory, 
            useCache: this.caching.useCache, 
            serviceName: 'ThemeSettingService', 
            site: this.site, 
            onlyThisSite: false
        });
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
                return cb(err, null);
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
     * Retrieves all of the settings for the specified plugin.
     *
     * @method getSettings
     * @param pluginName The name of the plugin who's settings are being requested
     * @param cb A callback that provides two parameters: cb(error, settings).
     * Null is provided in the event that the plugin is not installed.
     */
    PluginSettingService.prototype.getSettings = function(pluginName, cb) {
        this.pluginSettingsService.get(pluginName, cb);
    };

    /**
     * Gets the plugin settings for one site only.
     * Will not default to global plugin settings for given plugin.
     * @param {String} pluginName - name of plugin to retrieve settings for
     * @param {Function} cb - callback function
     */
    PluginSettingService.prototype.getSettingsBySite = function(pluginName, cb) {
    	var settings = getAdminPluginSettingsService(this);
    	settings.get(pluginName, cb);
    };

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
            return cb(new Error("PluginService: The setting value is required when modifing a theme setting"), false);
        }
        if (!pb.validation.validateNonEmptyStr(name, true)) {
            return cb(new Error("PluginService: The setting name is required when modifing a theme setting"), false);
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
            return cb(new Error("PluginSettingService: The settings object is required when making changes to plugin settings"), false);
        }
        if (!pluginName) {
            return cb(new Error("PluginSettingService: The plugin name is required when making changes to plugin settings"), false);
        }

        this.pluginService.isInstalled(pluginName, function(err, isInstalled) {
            if (util.isError(err) || !isInstalled) {
                return cb(err, false);
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
            return cb(new Error("PluginService: The setting value is required when modifing a theme setting"), false);
        }
        if (!pb.validation.validateNonEmptyStr(name, true)) {
            return cb(new Error("PluginService: The setting name is required when modifing a theme setting"), false);
        }

        //retrieve the settings to modify
        this.getThemeSettingsBySite(pluginName, function(err, settings) {
            if (util.isError(err) || !settings) {
                return cb(err, false);
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
            return cb(new Error("PluginSettingService: The settings object is required when making changes to theme settings"), false);
        }
        if (!pluginName) {
            return cb(new Error("PluginSettingService: The plugin name is required when making changes to theme settings"), false);
        }

        this.pluginService.isInstalled(pluginName, function(err, isInstalled) {
            if (util.isError(err) || !isInstalled) {
                return cb(err, false);
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
                return cb(err, null);
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

    /**
     * Retrieves theme settings for specified plugin and for only the specified site.
     * Will not default to global theme settings.
     * @param {String} pluginName - the name of the plugin to get theme settings
     * @param {Function} cb - callback function
     */
    PluginSettingService.prototype.getThemeSettingsBySite = function(pluginName, cb) {
    	var settings = getAdminThemeSettingsService(this);
    	settings.get(pluginName, cb);
    };

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
                    settings: details.settings,
                };
                baseDoc[SITE_FIELD] = self.site;
                var settings = pb.DocumentCreator.create('plugin_settings', baseDoc);

                //save it
                var dao = new pb.DAO();
                dao.save(settings, function(err/*, result*/) {
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
            return cb(new Error("PluginService: Settings are required when attempting to reset a plugin's theme settings"), false);
        }

        //retrieve plugin to prove it exists (plus we need the id)
        this.pluginService.getPluginBySite(pluginName, function(err, plugin) {
            if (util.isError(err) || !plugin) {
                return cb(err, false);
            }

            //remove any existing settings
            self.themeSettingsService.purge(pluginName, function (err, result) {
                if (util.isError(err) || !result) {
                    return cb(err, false);
                }

                //build the object to persist
                var baseDoc  = {
                    plugin_name: plugin.name,
                    plugin_uid: plugin.uid,
                    plugin_id: plugin[pb.DAO.getIdField()].toString(),
                    settings: details.theme.settings
                };
                baseDoc[SITE_FIELD] = self.site;
                var settings = pb.DocumentCreator.create('theme_settings', baseDoc);

                //save it
                var dao = new pb.DAO();
                dao.save(settings, function(err/*, result*/) {
                    cb(err, !util.isError(err));
                });
            });
        });
    };

    /**
     * @method purgePluginSettings
     * @param {String} pluginUid
     * @param {Function} cb
     */
    PluginSettingService.prototype.purgePluginSettings = function(pluginUid, cb) {
        this.pluginSettingsService.purge(pluginUid, cb);
    };

    /**
     * @method purgeThemeSettings
     * @param {String} pluginUid
     * @param {Function} cb
     */
    PluginSettingService.prototype.purgeThemeSettings = function(pluginUid, cb) {
        this.themeSettingsService.purge(pluginUid, cb);
    };


    /**
     * Convenience function to generate a service to handle settings for a plugin.
     *
     * @static
     * @method genSettingsService
     * @param {String} opts.objType The type of object that will be dealt with.  (plugin_settings,
     * theme_settings)
     * @param {Boolean} opts.useMemory Indicates if the generated layered service should
     * use an in memory service.
     * @param {Boolean} opts.useCache Indicates if the generated layered service should
     * use a cache service.
     * @param serviceName The name of the service
     * @param {String} opts.site
     * @param {Boolean} opts.onlyThisSite
     * @return {SimpleLayeredService}
     */
    function genSettingsService(opts) {
        
        //add in-memory service
        var services = [];

        var options = {
            objType: opts.objType,
            site: opts.site,
            onlyThisSite: opts.onlyThisSite
        };

        if (opts.useMemory) {
       	    options.timeout = pb.config.plugins.caching.memory_timeout;
            services.push(new pb.MemoryEntityService(options));
        }

        //add cache service
        if (opts.useCache) {
            services.push(new pb.CacheEntityService(options));
        }

        //always add DB
        options.keyField = 'plugin_uid';
        options.valueField = 'settings';
        services.push(new pb.DBEntityService(options));
        return new pb.SimpleLayeredService(services, opts.serviceName);
    }

    /**
     * @private
     * @static
     * @method getAdminPluginSettingsService
     * @param {PluginSettingService}
     * @returns {SimpleLayeredService}
     */
    function getAdminPluginSettingsService(self) {
    	if(!self.adminPluginSettingsService) {
            var opts = {
                objType: 'plugin_settings', 
                useMemory: self.caching.useMemory, 
                useCache: self.caching.useCache, 
                serviceName: 'PluginSettingService', 
                site: self.site, 
                onlyThisSite: true
            };
    		self.adminPluginSettingsService = genSettingsService(opts);
    	}
    	return self.adminPluginSettingsService;
    }

    /**
     * @private
     * @static
     * @method getAdminThemeSettingService
     * @param {PluginSettingService}
     * @returns {SimpleLayeredService}
     */
    function getAdminThemeSettingsService(self) {
    	if(!self.adminThemeSettingsService) {
            var opts = {
                objType: 'theme_settings', 
                useMemory: self.caching.useMemory, 
                useCache: self.caching.useCache, 
                serviceName: 'ThemeSettingService', 
                site: self.site, 
                onlyThisSite: true
            };
    		self.adminThemeSettingsService = genSettingsService(opts);
    	}
    	return self.adminThemeSettingsService;
    }
    
	return PluginSettingService;
};
