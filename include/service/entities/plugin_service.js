/**
 * PluginService - Provides functions for interacting with plugins.  
 * Install/uninstall, setting retrieval, plugin retrieval, etc.
 * 
 * @class PluginService
 * @constructor
 * @module Service
 * @submodule Entities
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC. All Rights Reserved
 */
function PluginService(){
	
	//construct settings services
	var caching = pb.config.plugins.caching;
	this.pluginSettingsService = PluginService.genSettingsService('plugin_settings', caching.useMemory, caching.useCache, 'PluginSettingService');
	this.themeSettingsService  = PluginService.genSettingsService('theme_settings', caching.useMemory, caching.useCache, 'ThemeSettingService');
}

//constants
var PLUGINS_DIR       = path.join(DOCUMENT_ROOT, 'plugins');
var DETAILS_FILE_NAME = 'details.json';
var PUBLIC_DIR_NAME   = 'public';

//statics
var ACTIVE_PLUGINS = {};

/**
 * Retrieves the names of the active plugins for this instance 
 * @method getActivePluginNames
 * @returns {array} An array that contain the names of the plugins that 
 * initialized successfully within this instance.
 */
PluginService.prototype.getActivePluginNames = function() {
	return Object.keys(ACTIVE_PLUGINS);
};

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
PluginService.prototype.getSetting = function(settingName, pluginName, cb) {
	this.getSettngs(pluginName, function(err, settings) {
		if (util.isError(err)) {
			cb(err, null);
			return;
		}
		
		cb(err, settings ? settings[settingName] : null);
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
PluginService.prototype.getSettings = function(pluginName, cb) {
	this.pluginSettingsService.get(pluginName, cb);
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
PluginService.prototype.setSetting = function(name, value, pluginName, cb) {
	var self = this;
	
	//error checking
	if (!PluginService.validateSettingValue(value)) {
		cb(new Error("PluginService: The setting value is required when modifing a theme setting"), false);
	}
	if (!pb.validation.validateNonEmptyStr(name, true)) {
		cb(new Error("PluginService: The setting name is required when modifing a theme setting"), false);
	}
	
	//retrieve the settings to modify
	this.getSettings(pluginName, function(err, settings) {
		if (util.isError(err) || !settings) {
			cb(err, false);
			return;
		}
		
		settings[name] = value;
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
PluginService.prototype.setSettings = function(settings, pluginName, cb) {
	var self = this;
	
	//error checking
	if (!settings) {
		cb(new Error("PluginService: The settings object is required when making changes to plugin settings"), false);
		return;
	}
	if (!pluginName) {
		cb(new Error("PluginService: The plugin name is required when making changes to plugin settings"), false);
		return;
	}
	
	this.isInstalled(pluginName, function(err, isInstalled) {
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
PluginService.prototype.setThemeSetting = function(name, value, pluginName, cb) {
	var self = this;
	
	//error checking
	if (!PluginService.validateSettingValue(value)) {
		cb(new Error("PluginService: The setting value is required when modifing a theme setting"), false);
	}
	if (!pb.validation.validateNonEmptyStr(name, true)) {
		cb(new Error("PluginService: The setting name is required when modifing a theme setting"), false);
	}
	
	//retrieve the settings to modify
	this.getThemeSettings(pluginName, function(err, settings) {
		if (util.isError(err) || !settings) {
			cb(err, false);
			return;
		}
		
		settings[name] = value;
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
PluginService.prototype.setThemeSettings = function(settings, pluginName, cb) {
	var self = this;
	
	//error checking
	if (!settings) {
		cb(new Error("PluginService: The settings object is required when making changes to theme settings"), false);
		return;
	}
	if (!pluginName) {
		cb(new Error("PluginService: The plugin name is required when making changes to theme settings"), false);
		return;
	}
	
	this.isInstalled(pluginName, function(err, isInstalled) {
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
PluginService.prototype.getThemeSetting = function(settingName, pluginName, cb) {
	this.getThemeSettngs(pluginName, function(err, settings) {
		if (util.isError(err)) {
			cb(err, null);
			return;
		}
		
		cb(err, settings ? settings[settingName] : null);
	});
};

/**
 * Retrieves the theme settings for the specified plugin
 * 
 * @method getThemeSettings
 * @param pluginName The uid of the plugin
 * @param cb A callback that provides two parameters: cb(err, settingsObject)
 */
PluginService.prototype.getThemeSettings = function(pluginName, cb) {
	this.themeSettingsService.get(pluginName, cb);
};

/**
 * Indicates if a plugin by the specified identifier is installed.
 * 
 * @method isInstalled
 * @param pluginIdentifer The identifier can either be an ObjectID or the 
 * plugin name
 * @param cb A callback that provides two parameters: cb(error, TRUE/FALSE). 
 * TRUE if the plugin is installed, FALSE if not.
 */
PluginService.prototype.isInstalled = function(pluginIdentifier, cb) {
	this.getPlugin(pluginIdentifier, function(err, plugin) {
		cb(err, plugin ? true : false);
	});
};

/**
 * Retrieves a plugin descriptor (plugin document)
 * 
 * @method getPlugin
 * @param pluginIdentifier The identifier can either be an ObjectID or the 
 * plugin name
 * @param cb A callback that provides two parameters: cb(error, plugin).  If the 
 * plugin does exist null is provided.
 */
PluginService.prototype.getPlugin = function(pluginIdentifier, cb) {
	var where = {};
	if (pluginIdentifier instanceof ObjectID) {
		where._id = pluginIdentifier;
	}
	else {
		where.uid = pluginIdentifier;
	}
	var dao = new pb.DAO();
	dao.loadByValues(where, 'plugin', cb);
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
 * @returns {SimpleLayeredService}
 */
PluginService.genSettingsService = function(objType, useMemory, useCache, serviceName) {
	
	//add in-memory service
	var services = [];
	if (useMemory){
		services.push(new pb.MemoryEntityService(objType));
	}
	
	//add cache service
	if (useCache) {
		services.push(new pb.CacheEntityService(objType));
	}
	
	//always add DB
	services.push(new pb.DBEntityService(objType, 'plugin_name', 'settings'));
	return new pb.SimpleLayeredService(services, serviceName);
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
PluginService.prototype.resetSettings = function(details, cb) {
	var self = this;
	
	//retrieve plugin to prove it exists (plus we need the id)
	var pluginName = details.uid;
	this.getPlugin(pluginName, function(err, plugin) {
		if (util.isError(err) || !plugin) {
			cb(err ? err : new Error("The plugin "+pluginName+"is not installed"), false);
			return;
		}
		
		//remove any existing settings
		self.pluginSettingsService.purge(pluginName, function (err, result) {
			if (util.isError(err) || !result) {
				cb(err, false);
				return;
			}
			
			//build the object to persist
			var baseDoc  = {
				plugin_name: plugin.name,
				plugin_uid: plugin.uid,
				plugin_id: plugin._id.toString(),
				settings: details.settings	
			};
			var settings = pb.DocumentCreator.create('plugin_settings', baseDoc);
			
			//save it
			var dao      = new pb.DAO();
			dao.update(settings).then(function(result) {
				if (util.isError(result)) {
					cb(result, false);
				}
				else {
					cb(null, true);
				}
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
PluginService.prototype.resetThemeSettings = function(details, cb) {
	var self = this;
	
	//error checking
	var pluginName = details.uid;
	if (!details.theme || !details.theme.settings) {
		cb(new Error("PluginService: Settings are required when attempting to reset a plugin's theme settings"), false);
		return;
	}
	
	//retrieve plugin to prove it exists (plus we need the id)
	this.getPlugin(pluginName, function(err, plugin) {
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
				plugin_id: plugin._id.toString(),
				settings: details.settings	
			};
			var settings = pb.DocumentCreator.create('theme_settings', baseDoc);
			
			//save it
			var dao      = new pb.DAO();
			dao.update(settings).then(function(result) {
				if (util.isError(result)) {
					cb(result, false);
				}
				else {
					cb(null, true);
				}
			});
		});
	});
};

PluginService.getPermissionsForRole = function(role) {
	if (!isNaN(role)) {
		role = pb.security.getRoleName(role);
	}

	var perms = {};
	for(var pluginUid in ACTIVE_PLUGINS) {
		var permissions = ACTIVE_PLUGINS[pluginUid].permissions;
		if (permissions) {
			
			var permsAtLevel = permissions[role];
			if (permsAtLevel) {pb.log.info('doing merge');
				pb.utils.merge(permsAtLevel, perms);
			}
		}
	}
	return perms;
};

PluginService.getActivePluginPublicDir = function(pluginUid) {
	var publicPath = null;
	if (ACTIVE_PLUGINS[pluginUid]) {
		publicPath = ACTIVE_PLUGINS[pluginUid].public_dir;
	}
	return publicPath;
};

PluginService.isActivePlugin = function(uid) {
	return ACTIVE_PLUGINS[uid] !== undefined;
};

PluginService.genPublicPath = function(plugin, relativePathToMedia) {
	return pb.utils.urlJoin('/public', plugin, relativePathToMedia);
};

PluginService.prototype.getActivePlugins = function(cb) {
	
	var where = {uid: {'$in': this.getActivePluginNames()}};
	var order = {created: pb.DAO.ASC};
	var dao   = new pb.DAO();
	dao.query('plugin', where, pb.DAO.SELECT_ALL, order).then(function(results) {
		if (util.isError(results)) {
			cb(results, null);
		}
		else {
			cb(null, results);
		}
	});
};

PluginService.prototype.getInactivePlugins = function(cb) {
	var where = {uid: {'$nin': this.getActivePluginNames()}};
	var order = {created: pb.DAO.ASC};
	var dao   = new pb.DAO();
	dao.query('plugin', where, pb.DAO.SELECT_ALL, order).then(function(results) {
		if (util.isError(results)) {
			cb(results, null);
		}
		else {
			cb(null, results);
		}
	});
};

PluginService.prototype.getAvailablePlugins = function(active, inactive, cb) {
	if (util.isArray(active)) {
		active = pb.utils.arrayToHash(active, function(active, i) {
			return active[i] ? active[i].uid : '';
		});
	}
	if (util.isArray(inactive)) {
		inactive = pb.utils.arrayToHash(inactive, function(inactive, i) {
			return inactive[i] ? inactive[i].uid : '';
		});
	}
	
	pb.utils.getDirectories(PluginService.getPluginsDir(), function(err, directories) {
		if (util.isError(err)) {
			cb(err, null);
			return;
		}
		
		var plugins   = [];
		var tasks     = pb.utils.getTasks(directories, function(directories, i) {
			return function(callback) {
				
				//skip pencilblue
				var parts   = directories[i].split(path.sep);
				var dirName = parts[parts.length - 1];
				if (dirName === 'pencilblue') {
					callback(null, true);
					return;
				}
				
				var detailsFilePath = path.join(directories[i], DETAILS_FILE_NAME);
				PluginService.loadDetailsFile(detailsFilePath, function(err, details) {
					if (util.isError(err)) {
						plugins.push({
							uid: dirName, 
							dirName: dirName, 
							message: "An invalid details file was provided for plugin. "+err.stack
						});
						callback(null, false);
						return;
					}
					
					PluginService.validateDetails(details, dirName, function(err, result) {
						if (util.isError(err)) {
							plugins.push({
								uid: dirName, 
								dirName: dirName, 
								message: "The plugin details file failed validation ",
								validationErrors: err.validationErrors
							});
							callback(null, false);
							return;
						}
						else if ( (active && active[details.uid]) || (inactive && inactive[details.uid])) {
							callback(null, true);
							return;
						}
						details.dirName = dirName;
						plugins.push(details);
						callback(null, true);
					});
				});
			};
		});
		async.series(tasks, function(err, results) {
			cb(err, plugins);
		});
	});
};

PluginService.prototype.getPluginMap = function(cb) {
	var self  = this;
	var tasks = {
         
         active: function(callback) {
        	 self.getActivePlugins(callback);
         },
         
         inactive: function(callback) {
        	 self.getInactivePlugins(callback);
         }
	};
	async.series(tasks, function(err, results) {
		if (util.isError(err)) {
			cb(err, results);
			return;
		}
		
		self.getAvailablePlugins(results.active, results.inactive, function(err, available) {
			results.available = available;
			cb(err, results);
		});
	});
};

PluginService.prototype.uninstallPlugin = function(pluginUid, cb) {
	var self = this;
	
	//log start of operation
	if (pb.log.isDebug()) {
		pb.log.debug("PluginService:[%s] Attempting uninstall", pluginUid);
	}
	
	//construct sequential tasks
	var plugin = null;
	var tasks = [
	         
         //load plugin
         function(callback) {
        	 pb.log.debug('PluginService:[%s] Attempting to load plugin ', pluginUid);
        	 self.getPlugin(pluginUid, function(err, pluginObj) {
        		if (util.isError(err)) {
        			callback(err, false);
        			return;
        		}
        		else if (!pluginObj) {
        			callback(new Error("The ["+pluginUid+"] plugin is not installed"), false);
        			return;
        		}
        		plugin = pluginObj;
        		callback(err, true);
        	 });
         },
         
         //call onUninstall
         function(callback) {
        	 var mm = ACTIVE_PLUGINS[pluginUid].main_module;
        	 if (typeof mm.onUninstall === 'function') {
        		 pb.log.debug('PluginService:[%s] Calling plugin onUnstall', pluginUid);
        		 
        		 mm.onUninstall(callback);
        	 }
        	 else {
        		 pb.log.debug('PluginService:[%s] Plugin onUnstall function does not exist.  Skipping.', pluginUid);
        		 callback(null, true);
        	 }
         },
         
         //unregister routes
         function(callback) {
        	 var routesRemoved = pb.RequestHandler.unregisterThemeRoutes(plugin.uid);
        	 pb.log.debug('PluginService:[%s] Unregistered %d routes', pluginUid, routesRemoved);
        	 process.nextTick(function(){callback(null, true);});
         },
         
         //remove localization
         function(callback) {
        	 //TODO refactor localization to figure out how to remove only those 
        	 //that were overriden. For now any overriden localizations will be 
        	 //left until the server cycles.  This is not ideal but will suffice 
        	 //for most use cases.  The only affected use case is if a default 
        	 //label is overriden.
        	 process.nextTick(function(){callback(null, false);});
         },
         
         //remove settings
         function(callback) {
     		self.pluginSettingsService.purge(pluginUid, function (err, result) {
     			callback(err, !util.isError(err) && result);
     		});
         },
         
         //remove theme settings
         function(callback) {
     		self.themeSettingsService.purge(pluginUid, function (err, result) {
     			callback(err, !util.isError(err) && result);
     		});
         },
         
         //remove plugin record from "plugin" collection
         function(callback) {
        	 var dao = new pb.DAO();
        	 dao.deleteById(plugin._id, 'plugin').then(function(result) {
        		var error = util.isError(result) ? result : null;
        		callback(error, error == null);
        	 });
         },
         
         //roll over to default theme
         function(callback) {
        	pb.settings.set('active_theme', 'pencilblue', function(err, result) {
        		callback(err, result ? true : false);
        	}); 
         },
         
         //remove from ACTIVE_PLUGINS//unregister services
         function(callback) {
        	 delete ACTIVE_PLUGINS[pluginUid];
        	 process.nextTick(function(){callback(null, false);});
         }
    ];
	async.series(tasks, function(err, results) {
		cb(err, !util.isError(err));
	});
};

/**
 * Installs a plugin by stepping through a series of steps that must be 
 * completed in order.  There is currently no fallback plan for a failed install.
 * In order for a plugin to be fully installed it must perform the following 
 * actions without error:
 * <ol>
 * <li>Load and parse the plugin's details.json file</li>
 * <li>Pass validation</li>
 * <li>Must not already be installed</li>
 * <li>Successfully register itself with the system</li>
 * <li>Successfully load any plugin settings</li>
 * <li>Successfully load any theme settings</li>
 * <li>Successfully execute the plugin's onInstall function</li>
 * <li>Successfully initialize the plugin for runtime</li>
 * </ol>
 * @method installPlugin
 * @param {string} pluginDirName The name of the directory that contains the 
 * plugin and its details.json file.
 * @param {function} cb A callback that provides two parameters: cb(err, TRUE/FALSE)
 */
PluginService.prototype.installPlugin = function(pluginDirName, cb) {
	var self            = this;
	var detailsFilePath = PluginService.getDetailsPath(pluginDirName);
	var details         = null;
	var plugin          = null;
	
	pb.log.info("PluginService: Beginning install of %s", pluginDirName);
	var tasks = [
	             
         //load the details file
         function(callback) {
        	 pb.log.info("PluginService: Attempting to load details.json file for %s", pluginDirName);
        	 
			PluginService.loadDetailsFile(detailsFilePath, function(err, loadedDetails) {
				details = loadedDetails;
				callback(err, null);
			});
         },
         
         //validate the details
         function(callback) {
        	 pb.log.info("PluginService: Validating details of %s", pluginDirName);
        	 
        	 PluginService.validateDetails(details, pluginDirName, callback);
         },
         
         //verify that the plugin is not installed
         function(callback) {
        	 pb.log.info("PluginService: Verifying that plugin %s is not already installed", details.uid);
        	 
        	 self.isInstalled(details.uid, function(err, isInstalled){
        		if (util.isError(err)) {
        			callback(err, isInstalled);
        		} 
        		else {
        			err = isInstalled ? (new Error('PluginService: The '+details.uid+' plugin is already installed')) : null;
        			callback(err, isInstalled);
                }
             });
         },
         
        //create plugin entry
        function(callback) {
        	 pb.log.info("PluginService: Setting system install flags for %s", details.uid);
        	 
        	 var clone     = pb.utils.clone(details);
        	 clone.dirName = pluginDirName;
        	 
        	 var pluginDescriptor = pb.DocumentCreator.create('plugin', clone);
        	 var dao              = new pb.DAO();
        	 dao.update(pluginDescriptor).then(function(result) {
        		 plugin = pluginDescriptor;
        		 callback(util.isError(result) ? result : null, result);
        	 });
         },
         
         //load plugin settings
         function(callback) {
        	 pb.log.info("PluginService: Adding settings for %s", details.uid);
        	 self.resetSettings(details, callback);
         },
         
         //load theme settings
         function(callback) {
        	 if (details.theme && details.theme.settings) {
        		 pb.log.info("PluginService: Adding theme settings for %s", details.uid);
        		 
        		 self.resetThemeSettings(details, callback);
        	 }
        	 else {
        		 callback(null, null);
        	 }
         },
         
        //call plugin's onInstall function
        function(callback) {
        	 
            var mainModule = PluginService.loadMainModule(pluginDirName, details.main_module.path);
    		if (mainModule !== null && typeof mainModule.onInstall === 'function') {
    			pb.log.info("PluginService: Executing %s 'onInstall' function", details.uid);
    			mainModule.onInstall(callback);
    		}
    		else {
    			pb.log.warn("PluginService: Plugin %s did not provide an 'onInstall' function.", details.uid);
    			callback(null, false);
    		}
        },
         
         //do plugin initialization
         function(callback) {
        	pb.log.info("PluginService: Initializing %s", details.uid);
        	self.initPlugin(plugin, callback); 
         },
         
         //notify cluster of plugin install
         function(callback) {
        	 pb.log.warn("PluginService: Cluster Notification for install of %s is not yet supported", pluginDirName);
        	 //TODO PluginInstall Notifications across cluster
        	callback(null, null); 
         }
	];
	async.series(tasks, function(err, results) {console.log(JSON.stringify(err));
		cb(err, !util.isError(err));
	});
};

PluginService.prototype.initPlugins = function(cb) {
	pb.log.debug('PluginService: Beginning plugin initilization...');
	
	var self = this;
	var dao  = new pb.DAO();
	dao.query('plugin').then(function(plugins) {
		if (util.isError(plugins)) {
			cb(plugins, null);
			return;
		}
		else if (!util.isArray(plugins)) {
			var err = new Error('An array of plugins was expected but found ['+(typeof plugins)+']['+util.inspect(plugins)+'] instead.');
			pb.log.error('PluginService %s', err.stack);
			cb(err, plugins);
			return;
		}
		
		//make sure there are plugins to initialize
		if (plugins.length === 0) {
			pb.log.debug('PluginService: No plugins are installed');
			cb(null, true);
			return;
		}
		var tasks  = pb.utils.getTasks(plugins, function(plugins, i) {
			return function(callback) {
				
				try {
					self.initPlugin(plugins[i], function(err, didInitialize) {
						process.nextTick(function() {
							callback(null, {plugin: plugins[i], error: err, initialized: didInitialize});
						});
					});
				}
				catch(err) {
					callback(null, {plugin: plugins[i], error: err, initialized: false});
				}
			};
		});
		async.parallel(tasks, function(err, results) {

			for (var i = 0; i < results.length; i++) {
				
				var result = results[i];
				if (result.initialized === true) {
					pb.log.debug('PluginService: Plugin [%s] was successfully initialized', result.plugin.name);
				}
				else {
					pb.log.warn('PluginService: Plugin [%s] failed to initialize.'+result.initialized, result.plugin.name);
				}
				if (result.error) {
					pb.log.error('PluginService: The following error was produced while initializing the %s plugin: %s', result.plugin.name, result.error.stack);
				}
			}
			
			cb(err, true);
		});
	});
};

/**
 * Initializes a plugin during startup or just after a plugin has been installed.
 * @param {plugin} pluginName
 * @param {function} cb
 */
PluginService.prototype.initPlugin = function(plugin, cb) {
	var self = this;
	
	if (typeof plugin !== 'object') {
		cb(new Error('PluginService:[INIT] The plugin object must be passed in order to initilize the plugin'), null);
		return;
	}
	
	pb.log.info("PluginService:[INIT] Beginning initialization of %s (%s)", plugin.name, plugin.uid);
	
	var details = null;
	var tasks   = [
	             
         //load the details file
         function(callback) {
        	 pb.log.debug("PluginService:[INIT] Attempting to load details.json file for %s", plugin.name);
        	 
			PluginService.loadDetailsFile(PluginService.getDetailsPath(plugin.dirName), function(err, loadedDetails) {
				details = loadedDetails;
				callback(err, null);
			});
         },
         
         //validate the details
         function(callback) {
        	 pb.log.debug("PluginService:[INIT] Validating details of %s", plugin.name);
        	 
        	 PluginService.validateDetails(details, plugin.dirName, callback);
         },
         
         //check for discrepencies
         function(callback) {
        	 if (plugin.uid != details.uid) {
        		 pb.log.warn('PluginService:[INIT] The UID [%s] for plugin %s does not match what was found in the details.json file [%s].  The details file takes precendence.', plugin.uid, plugin.name, details.uid);
        	 }
        	 process.nextTick(function() {callback(null, true);});
         },
         
         //register plugin & load main module
         function(callback) {
        	 
        	 //convert perm array to hash
        	 var map = {};
        	 if (plugin.permissions) {
        		 for (var role in plugin.permissions) {
        			 map[role] = pb.utils.arrayToHash(plugin.permissions[role]);
        		 }
        	 }
        	 
        	 //create cached active plugin structure
        	 var mainModule = PluginService.loadMainModule(plugin.dirName, details.main_module.path);
        	 ACTIVE_PLUGINS[details.uid] = {
    			 main_module: mainModule,
    			 public_dir: PluginService.getPublicPath(plugin.dirName),
    			 permissions: map
        	 };
        	 process.nextTick(function() {callback(null, true);});
         },
         
         //call plugin's onStartup function
         function(callback) {
        	var mainModule = ACTIVE_PLUGINS[details.uid].main_module;
        	if (typeof mainModule.onStartup === 'function') {
        		mainModule.onStartup(callback);
        	}
        	else {
        		pb.log.warn("PluginService: Plugin %s did not provide an 'onStartup' function.", details.uid);
        		callback(null, false);
        	}
         },
         
         //load services
         function(callback) {
        	 PluginService.getServices(path.join(PLUGINS_DIR, plugin.dirName), function(err, services) {
        		 ACTIVE_PLUGINS[details.uid].services = services;
        		 callback(err, util.isError(err));
        	 });
         },
         
         //process routes
         function(callback) {
        	 PluginService.loadControllers(path.join(PLUGINS_DIR, plugin.dirName), details.uid, callback);
         },
         
         //process localization
         function(callback) {
        	 
        	 self.getLocalizations(plugin.dirName, function(err, localizations) {
        		 for (var locale in localizations) {
        			 if (pb.log.isDebug()) {
        				 pb.log.debug('PluginService:[%s] Registering localizations for locale [%s]', details.uid, locale);
        			 }
        			 
        			 var result = pb.Localization.registerLocalizations(locale, localizations[locale]);
        			 if (!result && pb.log.isDebug()) {
        				 pb.log.debug('PluginService:[%s] Failed to register localizations for locale [%s].  Is the locale supported in your configuration?', details.uid, locale);
        			 }
        		 }
        		 callback(null, !util.isError(err));
        	 });
         }
    ];
	async.series(tasks, function(err, results) {
		//cleanup on error
		if (util.isError(err) && details && details.uid) {
			delete ACTIVE_PLUGINS[details.uid];
		}
		
		//callback with final result
		cb(err, !util.isError(err));
	});
};

PluginService.prototype.getLocalizations = function(pluginDirName, cb) {
	var localizationDir = path.join(PluginService.getPublicPath(pluginDirName), 'localization');
	
	fs.readdir(localizationDir, function(err, files) {
		if (util.isError(err)) {
			cb(err, null);
			return;
		}
		
		var localizations = {};
		var tasks = pb.utils.getTasks(files, function(files, index) {
			return function(callback) {
				
				var pathToLocalization = path.join(localizationDir, files[index]);
				fs.readFile(pathToLocalization, function(err, json) {
					if (!util.isError(err)) {
						
						//attempt to parse JSON and set service
						try {
							var localization    = JSON.parse(json);
							var name            = PluginService.getServiceName(pathToLocalization);
							localizations[name] = localization;
						}
						catch(e) {
							pb.log.warn('PluginService:[%s] Failed to parse localization JSON file at [%s]. %s', pluginDirName, pathToLocalization, e.stack);
						}
					}
					else {
						pb.log.warn('PluginService:[%s] Failed to load localization JSON file at [%s]', pluginDirName, pathToLocalization);
					}
					callback(null, true);
				});
			};
		});
		async.parallel(tasks, function(err, results) {
			cb(err, localizations);
		});
	});
};

PluginService.prototype.getService = function(serviceName, pluginUid) {
	if (ACTIVE_PLUGINS[pluginUid]) {
		if (ACTIVE_PLUGINS[pluginUid].services && ACTIVE_PLUGINS[pluginUid].services[serviceName]) {
			return ACTIVE_PLUGINS[pluginUid].services[serviceName];
		}
	}
	return null;
};

PluginService.loadMainModule = function(pluginDirName, pathToModule) {
	var pluginMM = path.join(PLUGINS_DIR, pluginDirName, pathToModule);
	var paths    = [pluginMM, pathToModule];
		
	var mainModule = null;
	for (var i = 0; i < paths.length; i++) {
		try {
			mainModule = require(paths[i]);
			break;
		}
		catch(e) {}
	}
	return mainModule;
};

/**
 * Retrieves the absolute file path to a plugin's public directory
 * 
 * @static
 * @method getPublicPath
 * @param pluginDirName The name of the directory that contains the intended 
 * plugin
 * @returns {string} the absolute file path to a plugin's public directory
 */
PluginService.getPublicPath = function(pluginDirName) {
	return path.join(PLUGINS_DIR, pluginDirName, PUBLIC_DIR_NAME);
};

/**
 * @returns {string} The absolute file path to the plugins directory
 */
PluginService.getPluginsDir = function() {
	return PLUGINS_DIR;
};

/**
 * Constructs the path to a specific plugin's details.json file
 * @return {string} The absolute file path to the details.json file for a plugin
 */
PluginService.getDetailsPath = function(pluginDirName) {
	return path.join(PLUGINS_DIR, pluginDirName, DETAILS_FILE_NAME);
};

/**
 * Attempts to load and parse the details.json file for a plugin. 
 * @param filePath The absolute path to the details.json file
 * @param cb A callback that provides two parameters: cb(error, detailsObject)
 */
PluginService.loadDetailsFile = function(filePath, cb) {
	fs.readFile(filePath, function(err, data){
		if (util.isError(err)) {
			cb(err, null);
			return;
		}
		
		//atempt to parse the json
		try {
			cb(null, JSON.parse(data));
		}
		catch(e) {
			cb(e, null);
		}
	});
};

/**
 * Validates a plugin's details.json file.  
 * 
 * @param details The details object to validate
 * @param pluginDirName The name of the directory containing the original 
 * details.json file that the details object was derived from.
 * @param cb A callback that provides two parameters: cb(error, TRUE/FALSE).  
 * TRUE if the details object passes validation, FALSE if not.
 */
PluginService.validateDetails = function(details, pluginDirName, cb) {
	if (!details) {
		cb(new Error("Details cannot be null"), false);
		return;
	}
	
	//setup 
	var errors = [];
	var v      = pb.validation;
	
	//validate uid
	if (!v.validateSafeFileName(details.uid, true)) {
		errors.push(new Error("The uid field must be provided and can only contain alphanumerics, underscores, and dashes"));
	}
	
	//validate display name
	if (!v.validateNonEmptyStr(details.name, true)) {
		errors.push(new Error("An invalid name ["+details.name+"] was provided"));
	}
	
	//validate description
	if (!v.validateNonEmptyStr(details.description, true)) {
		errors.push(new Error("A valid description must be provided"));
	}
	
	//validate version
	if (!v.validateVersionNum(details.version, true)) {
		errors.push(new Error("An invalid version number ["+details.version+"] was provided.  Must match the form: xx.xx.xx"));
	}
	
	//validate icon
	if (details.icon) {
		if (!pb.utils.isString(details.icon) || !PluginService.validateIconPath(details.icon, pluginDirName)) {
			errors.push(new Error("The optional plugin icon must be a valid path to an image"));
		}
	}
	
	//validate author block
	if (details.author) {
		var author = details.author;
		
		//validate name
		if (!v.validateNonEmptyStr(author.name, true)) {
			errors.push(new Error("A valid author name must be provided"));
		}
		
		//validate email
		if (!v.validateEmail(author.email, true)) {
			errors.push(new Error("A valid author email must be provided"));
		}
		
		//validate website
		if (!v.validateUrl(author.website, false)) {
			errors.push(new Error("The website address is not a valid URL"));
		}
		
		//validate contributors
		if (author.contributors) {
			if (v.validateArray(author.contributors, true)) {
				
				for (var i = 0; i < author.contributors.length; i++) {
					
					var cont = author.contributors[i];
					if (v.validateObject(cont, true)) {
						
						//validate contributor name
						if (!v.validateNonEmptyStr(cont.name, true)) {
							errors.push(new Error("The contributor name at position "+i+" must be provided"));
						}
						
						//validate contributor email
						if (!v.validateEmail(cont.email, false)) {
							errors.push(new Error("The contributor email at position "+i+" is invalid"));
						}
					}
					else {
						errors.push(new Error("The contributor at position "+i+" must be an object"));
					}
				}
			}
			else {
				errors.push(new Error("The author contributors block must be an array"));
			}
		}
	}
	else {
		errors.push(new Error("The author block is required"));
	}
	
	//validate plugin settings
	if (details.settings) {
		
		if (v.validateArray(details.settings, true)) {
			
			//validate each setting
			for (var i = 0; i < details.settings.length; i++) {
				
				//set any errors derived
				var settingErrs = PluginService.validateSetting(details.settings[i], i);
				for (var j = 0; j < settingErrs.length; j++) {
					errors.push(settingErrs[j]);
				}
			}
		}
		else {
			errors.push(new Error("The settings block must be an array"));
		}
	}
	
	//validate permissions
	if (v.validateObject(details.permissions, true)) {
		
		var validKeys = {"ACCESS_USER": 1, "ACCESS_WRITER": 1, "ACCESS_EDITOR": 1, "ACCESS_MANAGING_EDITOR": 1};
		for (var key in details.permissions) {
			
			//validate permission key
			if (validKeys[key] === undefined) {
				errors.push("An invalid permissions map key ["+key+"] was provided");
			}
			else {
				var val = details.permissions[key];
				if (v.validateArray(val, true)) {
					
					for (var i = 0; i < details.permissions[key].length; i++) {
						if (!v.validateNonEmptyStr(details.permissions[key][i], true)) {
							errors.push(new Error("The value at position "+i+" for permissions map key ["+key+"] is invalid"));
						}
					}
				}
				else {
					errors.push("Permissions map key ["+key+"] was provided must provide an array of permissions");
				}
			}
		}
	}
	else {
		errors.push(new Error("The permissions block is required and must be an object"));
	}
	
	//validate main module
	if (v.validateObject(details.main_module, true)) {
		
		if (!PluginService.validateMainModulePath(details.main_module.path, pluginDirName)) {
			errors.push(new Error("An invalid main module path and/or file was provided"));
		}
	}
	else {
		errors.push(new Error("The main module block is required and must be an object"));
	}
	
	//validate theme
	if (details.theme) {
		
		if (v.validateObject(details.theme, true)) {
			
			//validate settings block
			if (details.theme.settings) {
				
				if (v.validateArray(details.theme.settings, true)) {
					
					//validate each setting
					for (var i = 0; i < details.theme.settings.length; i++) {
						
						//set any errors derived
						var settingErrs = PluginService.validateSetting(details.theme.settings[i], i);
						for (var j = 0; j < settingErrs.length; j++) {
							errors.push(settingErrs[j]);
						}
					}
				}
				else {
					errors.push(new Error("The theme settings block must be an array"));
				}
			}
			
			//validate theme content templates
			if (details.theme.content_templates) {
				
				if (v.validateArray(details.theme.content_templates, true)) {
					
					//validate each content template
					for (var i = 0; i < details.theme.content_templates.length; i++) {
						
						var template = details.theme.content_templates[i];
						if (v.validateObject(template, true)) {
							
							//validate content template name
							if (!v.validateNonEmptyStr(template.name, true)) {
								errors.push(new Error("The content template name at position "+i+" is invalid"));
							}
							
							//validate content template file
							if (!v.validateSafeFileName(template.file, true)) {
								errors.push(new Error("The content template file at position "+i+" is invalid"));
							}
						}
						else {
							errors.push(new Error("The content template at position "+i+" is invalid"));
						}
					}
				}
				else {
					errors.push(new Error("The content templates property must be an array"));
				}
			}
		}
		else {
			errors.push(new Error("The theme block must be an object"));
		}
	}
	
	//prepare validation response
	var error   = null;
	var isError = errors.length > 0;
	if (isError) {
		error = new Error("Faled to validate plugin details");
		error.validationErrors = errors;
	}
	cb(error, !isError);
};

/**
 * Validates the path to the plugin's icon file.  The path is considered valid 
 * if the path to a valid file.  The path may be absolute or relative to the 
 * plugin's public directory.
 * 
 * @param iconPath The path to the icon (image) file
 * @param pluginDirName The name of the directory housing the plugin
 * @returns {Boolean} TRUE if the path is valid, FALSE if not
 */
PluginService.validateIconPath = function(iconPath, pluginDirName) {
	var pluginPublicIcon = path.join(PluginService.getPublicPath(pluginDirName), iconPath);
	var paths            = [pluginPublicIcon, iconPath];
	
	for (var i = 0; i < paths.length; i++) {
		if (fs.existsSync(paths[i])) {
			return true;
		}
	}	
	return false;
};

/**
 * Validates the path of a main module file.  The path is considered valid if 
 * the path points to JS file.  The path may be absolute or relative to the 
 * specific plugin directory.
 * 
 * @param mmPath The relative or absolute path to the main module file
 * @param pluginDirName The name of the directory housing the plugin
 * @returns {Boolean} TRUE if the path is valid, FALSE if not
 */
PluginService.validateMainModulePath = function(mmPath, pluginDirName) {
	return PluginService.loadMainModule(pluginDirName, mmPath) !== null;
};

/**
 * Validates a setting from a details.json file. 
 *  
 * @param setting The setting to validate
 * @param position The position in the settings array where the setting resides 
 * as a 0 based index.
 * @returns {Array} The array of errors that were generated.  If no errors were 
 * produced an empty array is returned.
 */
PluginService.validateSetting = function(setting, position) {
	
	//setup
	var errors = [];
	var v      = pb.validation;
	
	//validate object
	if (pb.utils.isObject(setting)) {
		
		//validate name
		if (!v.validateNonEmptyStr(setting.name, true)) {
			errors.push(new Error("The setting name at position "+position+" must be provided"));
		}
		
		//validate value
		if (!PluginService.validateSettingValue(setting.value)) {
			errors.push(new Error("The setting value at position "+position+" must be provided"));
		}
	}
	else {
		errors.push(new Error("The setting value at position "+position+" must be an object"));
	}

	return errors;
};

/**
 * Validates a details.json file's setting value.  The value is required to be a 
 * string or a number.  Null, undefined, Arrays, Objects, and prototypes are NOT 
 * allowed.
 * 
 * @param value The value to validate
 * @returns {Boolean} TRUE if the value is valid, FALSE if not
 */
PluginService.validateSettingValue = function(value) {
	return pb.utils.isString(value) || !isNaN(value);
};

/**
 * Retrieves all services (initialized).  The services are provided in the 
 * callback.
 * 
 * @param pathToPlugin The absolute file path to the specific plugin directory.
 * @param cb A callback that provides two parameters: cb(error, servicesHash);
 */
PluginService.getServices = function(pathToPlugin, cb) {
	var servicesDir = path.join(pathToPlugin, 'services');
	
	fs.readdir(servicesDir, function(err, files) {
		if (util.isError(err)) {
			cb(err, null);
			return;
		}
		
		var services = {};
		var tasks = pb.utils.getTasks(files, function(files, index) {
			return function(callback) {
				
				var pathToService = path.join(servicesDir, files[index]);
				PluginService.loadService(pathToService, function(err, service) {
					if (!util.isError(err)) {
					
						var name = PluginService.getServiceName(pathToService, service);
						services[name] = service;
					}
					else {
						pb.log.warn('PluginService: Failed to load service at [%s]', pathToService);
					}
					callback(null, true);
				});
			};
		});
		async.parallel(tasks, function(err, results) {
			cb(err, services);
		});
	});
};

/**
 * Loads a plugin service and initializes it.  The service is required to 
 * implement an "init" function. The service is then provided as a parameter in 
 * the callback.
 * 
 * @param pathToService The absolute file path to the service javascript file.
 * @param cb A callback that provides two parameters: cb(error, initializedService)
 */
PluginService.loadService = function(pathToService, cb) {
	try {
		pb.log.debug("PluginService: Attempting to load service ["+pathToService+"]");
		var service = require(pathToService);
		
		pb.log.debug("PluginService: Initializing service ["+pathToService+"]");
		service.init(function(err, result) {
			cb(err, service);
		});
	}
	catch(e){
		pb.log.error("PluginService: Failed to load service: ["+pathToService+"]: "+e.stack);
		cb(e, null);
	}
};

PluginService.loadControllers = function(pathToPlugin, pluginUid, cb) {
	var controllersDir = path.join(pathToPlugin, 'controllers');
	
	fs.readdir(controllersDir, function(err, files) {
		if (util.isError(err)) {
			cb(err, null);
		}

		var tasks = pb.utils.getTasks(files, function(files, index) {
			return function(callback) {
				
				var pathToController = path.join(controllersDir, files[index]);
				PluginService.loadController(pathToController, pluginUid, function(err, service) {
					if (util.isError(err)) {
						pb.log.warn('PluginService: Failed to load controller at [%s]: %s', pathToController, err.stack);
					}
					callback(null, util.isError(err));
				});
			};
		});
		async.parallel(tasks, function(err, results) {
			cb(err, results);
		});
	});
};

PluginService.loadController = function(pathToController, pluginUid, cb) {
	try {
		
		//load the controller type
		var ControllerPrototype = require(pathToController);
		
		//ensure we can get the routes
		if (typeof ControllerPrototype.getRoutes !== 'function'){
			throw new Error('Controller at ['+pathToController+'] does not implement function "getRoutes"');
		}
		
		//get the routes
		ControllerPrototype.getRoutes(function(err, routes) {
			if (util.isError(err)) {
				cb(err, null);
				return;
			}
			else if (!util.isArray(routes)) {
				cb(new Error('Controller at ['+pathToController+'] did not return an array of routes'), null);
				return;
			}
			
			//attempt to register route
			for(var i = 0; i < routes.length; i++) {
				var route        = routes[i];
				route.controller = pathToController;
				var result       = pb.RequestHandler.registerRoute(route, pluginUid);
				
				//verify registration
				if (!result) {
					pb.log.warn('PluginService: Failed to register route [%s] for controller at [%s]', util.inspect(route), pathToController);
				}
			}
			
			//do callback
			cb(null, true);
		});
	}
	catch(err) {
		cb(err, null);
	}
};

/**
 * Derives the name of a plugin service instance.  The function attempts to get 
 * the name of the service by looking to see if the service has implemented the 
 * getName function.  If it has not then the service name is set to be the file 
 * name minus any extension.
 * 
 * @param pathToService The file path to the service
 * @param service The service prototype
 * @returns {String} The derived service name
 */
PluginService.getServiceName = function(pathToService, service) {
	var name = 'UNKNOWN';
	if (service && typeof service.getName === 'function') {
		name = service.getName();
	}
	else {
		var pieces = pathToService.split(path.sep);
		name       = pieces[pieces.length - 1];
		var index  = name.lastIndexOf('.');
		if (index > 0) {
			name = name.substring(0, index);
		}
	}
	return name;
};

//exports
module.exports = PluginService;
