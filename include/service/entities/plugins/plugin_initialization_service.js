/*
 Copyright (C) 2016  PencilBlue, LLC

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
'use strict';

//dependencies
var async = require('async');
var semver = require('semver');
var path = require('path');
var domain = require('domain');

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;
    var PluginService = pb.PluginService;
    var SiteService = pb.SiteService;

    class PluginInitializationService {
        constructor(context) {

            this.pluginService = context.pluginService;

            this.pluginCache = context.pluginCache;
        }

        initialize (plugin, options, cb) {
            if (!util.isObject(plugin)) {
                return cb(new Error('PluginInitializationService: The plugin object must be passed in order to initialize the plugin'));
            }

            pb.log.debug("PluginInitializationService: Initialization of %s (%s) for site %s", plugin.name, plugin.uid, plugin.site);

            var self = this;
            var tasks = this.getInitTasksForPlugin(plugin);
            async.series(tasks, function(err/*, results*/) {
                //cleanup on error
                if (util.isError(err)) {
                    PluginService.deactivatePlugin(plugin.uid, plugin.site);

                    //log it all
                    var hasValidationErrs = !!err.validationErrors;
                    pb.log.error('PluginInitializationService:[%s] failed to initialize: %s', plugin.uid, hasValidationErrs ? err.message : err.stack);
                    if (hasValidationErrs) {
                        err.validationErrors.forEach(function(validationError) {
                            pb.log.error('PluginInitializationService:[%s] details.json validation error FIELD=%s MSG=%s', plugin.uid, validationError.field, validationError.message);
                        });
                    }
                }
                else {
                    pb.log.debug('PluginInitializationService:[%s] successfully initialized', plugin.name, plugin.uid);
                }

                cb(err, !util.isError(err));
            });
        }

        /**
         * Returns tasks to be executed for initializing a plugin.
         * A cache is used to store already known plugin information that can be shared between sites to speed up the process.
         * @method getInitTasksForPlugin
         * @param {object} plugin The plugin details
         * @return {Array}
         */
        getInitTasksForPlugin (plugin) {
            var self = this;
            var details = null;
            var pluginSpec = null;
            var site = plugin.site || SiteService.GLOBAL_SITE;
            var cached_plugin = this.pluginCache[plugin.uid] || null;
            var syncSettingsAtStartup = pb.config.settings.syncSettingsAtStartup;

            // TODO: Abstract the construction of these init tasks
            var site_independent_tasks = [

                //load the details file
                function(callback) {
                    pb.log.debug("PluginInitializationService:[INIT] Attempting to load details.json file for %s", plugin.name);

                    if(!cached_plugin || !cached_plugin.details) {
                        return PluginService.loadDetailsFile(PluginService.getDetailsPath(plugin.dirName), function (err, loadedDetails) {
                            details = loadedDetails;
                            if (syncSettingsAtStartup && !util.isError(err) && details) {
                                // TODO: Can we sync these plugin settings without instantiating a new PluginService each time?
                                var pluginService = new PluginService({site: site});
                                pluginService.syncSettings(plugin, details, callback);
                            }
                            else {
                                callback(err, !!details);
                            }
                        });
                    }
                    callback(null, true);
                },

                function(callback) {
                    self.pluginCache[plugin.uid].details = details;
                    plugin.dependencies = details.dependencies;
                    callback(null, true);
                },

                //validate the details
                function(callback) {
                    pb.log.debug("PluginInitializationService:[INIT] Validating details of %s", plugin.name);
                    PluginService.validateDetails(details, plugin.dirName, callback);
                },

                //check for discrepancies
                function(callback) {
                    if (plugin.uid !== details.uid) {
                        pb.log.warn('PluginInitializationService:[INIT] The UID [%s] for plugin %s does not match what was found in the details.json file [%s].  The details file takes precendence.', plugin.uid, plugin.name, details.uid);
                    }
                    process.nextTick(function () {
                        callback(null, true);
                    });
                },

                //verify that NPM dependencies are available
                function(callback) {
                    if (!util.isObject(details.dependencies) || details.dependencies === {}) {
                        //no dependencies were declared so we're good
                        return callback(null, true);
                    }

                    //iterate over dependencies to ensure that they exist
                    var npmService = new pb.NpmPluginDependencyService();
                    npmService.installAll(plugin.dependencies, {pluginUid: plugin.uid}, function(err/*, results*/) {
                        callback(err, !util.isError(err));
                    });
                },

                //verify that the Bower dependencies are available
                function(callback) {
                    if(!util.isObject(details.bowerDependencies) || details.bowerDependencies === {}) {
                        //no bower dependencies declared so we're good
                        return callback(null, true);
                    }

                    var bowerService = new pb.BowerPluginDependencyService();
                    bowerService.installAll(plugin.bowerDependencies, {pluginUid: plugin.uid}, function(err/*, results*/) {
                        callback(err, !util.isError(err));
                    });
                },

                // check the pb version plugin supports
                function(callback) {
                    if (!details.pb_version) {
                        // pb version was not specified
                        // assumes plugin is compatible with all pb versions
                        pb.log.warn('PluginInitializationService: The plugin, %s does not specify pb version.', details.name);
                        return callback(null, true);
                    } else {
                        var results = semver.satisfies(pb.config.version, details.pb_version);

                        return callback(null, results);
                    }
                }
            ];

            var tasks   = [
                // Sync plugin settings
                function(callback) {
                    if (cached_plugin && cached_plugin.details && syncSettingsAtStartup) {
                        var pluginService = new PluginService({site: site});
                        pluginService.syncSettings(plugin, cached_plugin.details, callback);
                    }
                    else {
                        return callback(null, true);
                    }
                },

                //register plugin & load main module
                function(callback) {

                    //convert perm array to hash
                    var map = {};
                    if (plugin.permissions) {
                        pb.log.debug('PluginInitializationService:[INIT] Loading permission sets for plugin [%s]', details.uid);

                        for (var role in plugin.permissions) {
                            map[role] = util.arrayToHash(plugin.permissions[role]);
                        }
                    }
                    else {
                        pb.log.debug('PluginInitializationService:[INIT] Skipping permission set load for plugin [%s]. None were found.', details.uid);
                    }

                    //create cached active plugin structure
                    var templates  = null;
                    if (details.theme && details.theme.content_templates) {
                        templates = details.theme.content_templates;
                        for (var i = 0; i < templates.length; i++) {
                            templates[i].theme_name = details.name;
                        }
                    }
                    var mainModule = PluginService.loadMainModule(plugin.dirName, details.main_module.path);
                    if (!mainModule) {
                        return callback(new Error('Failed to load main module for plugin '+plugin.uid));
                    }

                    pluginSpec = {
                        main_module: mainModule,
                        public_dir: PluginService.getPublicPath(plugin.dirName),
                        permissions: map,
                        templates: templates,
                        icon: details.icon ? PluginService.genPublicPath(details.uid, details.icon) : undefined
                    };
                    process.nextTick(function() {callback(null, true);});
                },

                //call plugin's onStartup function
                function(callback) {
                    pb.log.debug('PluginInitializationService:[INIT] Attempting to call onStartup function for %s.', details.uid);

                    var mainModule = pluginSpec.main_module;
                    if (util.isFunction(mainModule.onStartupWithContext) || util.isFunction(mainModule.onStartup)) {
                        var timeoutProtect = setTimeout(function() {

                            // Clear the local timer variable, indicating the timeout has been triggered.
                            timeoutProtect = null;
                            callback(new Error("PluginInitializationService: Startup function for plugin "+details.uid+" never called back!"), false);

                        }, 2000);

                        //attempt to make connection
                        var d = domain.create();
                        var onDone = function(err, result) {
                            d.removeAllListeners('error');
                            callback(err, result);
                        };
                        d.once('error', function(err) {
                            if (timeoutProtect) {
                                clearTimeout(timeoutProtect);
                                onDone(err, false);
                            }
                            else {
                                pb.log.error('PluginInitializationService:[INIT] Plugin %s failed to start. %s', details.uid, err.stack);
                            }
                        });
                        d.run(function () {
                            if (util.isFunction(mainModule.prototype.onStartup)) {
                                mainModule = new mainModule(site);
                            }
                            if (util.isFunction(mainModule.onStartupWithContext)) {
                                var context = {site: site};
                                mainModule.onStartupWithContext(context, startupCallback);
                            }
                            else {
                                mainModule.onStartup(startupCallback);
                            }
                            function startupCallback(err, didStart) {
                                if (util.isError(err)) {
                                    throw err;
                                }

                                if (timeoutProtect) {
                                    pb.log.debug('PluginInitializationService:[INIT] Plugin %s onStartup returned with result: %s', details.uid, didStart);

                                    clearTimeout(timeoutProtect);
                                    onDone(err, didStart);
                                }
                            }
                        });
                    }
                    else {
                        pb.log.warn("PluginInitializationService: Plugin %s did not provide an 'onStartup' function.", details.uid);
                        callback(null, false);
                    }
                },

                //load services
                function(callback) {
                    if(cached_plugin && cached_plugin.services) {
                        pluginSpec.services = cached_plugin.services;
                        return callback(null, true);
                    }

                    var service = new pb.PluginServiceLoader({pluginUid: plugin.uid});
                    service.getAll({}, function(err, services) {
                        if (util.isError(err)) {
                            pb.log.debug("PluginInitializationService[INIT]: No services directory was found for %s", details.uid);
                        }
                        if (!services) {
                            pb.log.debug("PluginInitializationService[INIT]: No services were found for %s", details.uid);
                            services = {};
                        }
                        pluginSpec.services = services;
                        plugin.services = services;
                        callback(null, !util.isError(err));
                    });
                },

                //set as active
                function(callback) {
                    callback(null, PluginService.activatePlugin(details.uid, pluginSpec, site));
                },

                //process routes
                function(callback) {
                    var controllerLoader = new pb.PluginControllerLoader({pluginUid: plugin.uid, site: site});
                    controllerLoader.getAll({register: true}, callback);
                },

                //process localization
                function(callback) {
                    var service = new pb.PluginLocalizationLoader({pluginUid: details.uid, site: site});
                    service.getAll({register: true}, callback);
                }
            ];

            if(cached_plugin) {
                details = cached_plugin.details;
                return tasks;
            }
            this.pluginCache[plugin.uid] = plugin;
            return site_independent_tasks.concat(tasks);
        }
    }

    return PluginInitializationService;
};
