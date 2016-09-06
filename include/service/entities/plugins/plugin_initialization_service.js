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

    /**
     * Initializes a plugin
     * @class PluginInitializationService
     * @constructor
     * @param {object} context
     * @param {PluginService} context.pluginService
     * @param {object} context.pluginCache
     */
    class PluginInitializationService {
        constructor(context) {

            /**
             * @property pluginService
             * @type {PluginService}
             */
            this.pluginService = context.pluginService;

            /**
             * @property pluginCache
             * @type {object}
             */
            this.pluginCache = context.pluginCache;
        }

        /**
         * @static
         * @property DEFAULT_CONCURRENCY
         * @returns {number}
         */
        static get DEFAULT_CONCURRENCY () {
            return 2;
        }

        /**
         * Performs the initialization for the plugin.
         * @method initialize
         * @param {object} plugin
         * @param {string} plugin.uid
         * @param {string} plugin.site
         * @param {object} options
         * @param {number} [options.concurrency=2]
         * @param {function} cb
         */
        initialize (plugin, options, cb) {
            if (!util.isObject(plugin)) {
                return cb(new Error('The plugin object must be passed in order to initialize the plugin'));
            }
            if (!util.isObject(options)) {
                return cb(new Error('The options argument must be an object'));
            }

            pb.log.debug("PluginInitializationService:[%s] Initializing plugin for site=%s", plugin.uid, plugin.site);

            var concurrency = options.concurrency || PluginInitializationService.DEFAULT_CONCURRENCY;
            var tasks = this.getTasks(plugin);
            async.auto(tasks, concurrency, function(err/*, results*/) {
                if (util.isError(err)) {
                    PluginInitializationService.handleInitializationError(plugin, err);
                }
                else {
                    pb.log.debug('PluginInitializationService:[%s] successfully initialized', plugin.uid);
                }

                cb(err);
            });
        }

        /**
         * Builds out the tasks that will be used to initialize the plugin.  Each registered task is expected to provide
         * a set of dependencies as well as a task function.
         * @method getTasks
         * @param {object} plugin
         * @param {string} plugin.uid
         * @param {string} [plugin.site=global]
         * @returns {object}
         */
        getTasks (plugin) {

            var context = {
                pluginInitializationService: this,
                pluginService: this.pluginService,
                cachedPlugin: this.pluginCache[plugin.uid],
                isCachedPlugin: !!this.pluginCache[plugin.uid],
                site: plugin.site || SiteService.GLOBAL_SITE,
                plugin: plugin
            };

            //derive tasks.
            var tasks = {};
            Object.keys(registeredTasks).forEach(function(taskName) {
                tasks[taskName] = registeredTasks[taskName](context);
            });

            this.pluginCache[plugin.uid] = plugin;
            return tasks;
        }

        /**
         * @static
         * @method getDetailsHandler
         * @param {object} context
         * @param {PluginInitializationService} context.pluginInitializationService
         * @param {PluginService} context.pluginService
         * @param {object} context.cachedPlugin
         * @param {boolean} context.isCachedPlugin
         * @param {string} context.site
         * @param {object} context.plugin
         * @returns {Array}
         */
        static getDetailsHandler (context) {
            return [function(callback/*, results*/) {


                //look in cache first
                if (context.cachedPlugin && !!context.cachedPlugin.details) {
                    return callback(null, context.cachedPlugin.details);
                }

                //it isn't cached so go load it
                PluginService.loadDetailsFile(PluginService.getDetailsPath(context.plugin.uid), callback);
            }];
        }

        /**
         * @static
         * @method getValidationOutputHandler
         * @param {object} context
         * @param {PluginInitializationService} context.pluginInitializationService
         * @param {PluginService} context.pluginService
         * @param {object} context.cachedPlugin
         * @param {boolean} context.isCachedPlugin
         * @param {string} context.site
         * @param {object} context.plugin
         * @returns {Array}
         */
        static getValidationOutputHandler (context) {
            return PluginInitializationService.buildNoActionOnCachedTask(context, ['validationErrors'], function(callback, results) {
                var err = null;
                results.validationErrors = results.validationErrors || [];
                if (results.validationErrors.length > 0) {
                    err = new Error("Failed to validate plugin details for plugin "+context.plugin.uid);
                    err.validationErrors = results.validationErrors;
                }
                callback(err);
            });
        }

        /**
         * @static
         * @method getUidCheckHandler
         * @param {object} context
         * @param {PluginInitializationService} context.pluginInitializationService
         * @param {PluginService} context.pluginService
         * @param {object} context.cachedPlugin
         * @param {boolean} context.isCachedPlugin
         * @param {string} context.site
         * @param {object} context.plugin
         * @returns {Array}
         */
        static getUidCheckHandler (context) {
            return PluginInitializationService.buildNoActionOnCachedTask(context, ['validationOutput'], function(callback, results) {
                callback(context.plugin.uid !== results.details.uid ? new Error(util.format('The UID [%s] for plugin %s does not match what was found in the details.json file [%s].  The details file takes precedence.', context.plugin.uid, context.plugin.name, results.details.uid)) : null);
            });
        }

        /**
         * @static
         * @method getNpmDependencyCheckHandler
         * @param {object} context
         * @param {PluginInitializationService} context.pluginInitializationService
         * @param {PluginService} context.pluginService
         * @param {object} context.cachedPlugin
         * @param {boolean} context.isCachedPlugin
         * @param {string} context.site
         * @param {object} context.plugin
         * @returns {Array}
         */
        static getNpmDependencyCheckHandler (context) {
            return PluginInitializationService.buildNoActionOnCachedTask(context, ['pluginCacheSync'], function(callback, results) {
                if (!util.isObject(results.details.dependencies) || Object.keys(results.details.dependencies).length === 0) {
                    //no dependencies were declared so we're good
                    return callback();
                }

                //iterate over dependencies to ensure that they exist
                var npmService = new pb.NpmPluginDependencyService();
                npmService.installAll(context.plugin.dependencies, {pluginUid: context.plugin.uid}, callback);
            });
        }

        /**
         * @static
         * @method getBowerDependencyCheckHandler
         * @param {object} context
         * @param {PluginInitializationService} context.pluginInitializationService
         * @param {PluginService} context.pluginService
         * @param {object} context.cachedPlugin
         * @param {boolean} context.isCachedPlugin
         * @param {string} context.site
         * @param {object} context.plugin
         * @returns {Array}
         */
        static getBowerDependencyCheckHandler (context) {
            return PluginInitializationService.buildNoActionOnCachedTask(context, ['pluginCacheSync'], function(callback, results) {
                if (!util.isObject(results.details.bowerDependencies) || Object.keys(results.details.bowerDependencies).length === 0) {
                    //no bower dependencies declared so we're good
                    return callback();
                }

                var bowerService = new pb.BowerPluginDependencyService();
                bowerService.installAll(results.details.bowerDependencies, {pluginUid: results.details.uid}, callback);
            });
        }

        /**
         * @static
         * @method getVersionCheckHandler
         * @param {object} context
         * @param {PluginInitializationService} context.pluginInitializationService
         * @param {PluginService} context.pluginService
         * @param {object} context.cachedPlugin
         * @param {boolean} context.isCachedPlugin
         * @param {string} context.site
         * @param {object} context.plugin
         * @returns {Array}
         */
        static getVersionCheckHandler (context) {
            return PluginInitializationService.buildNoActionOnCachedTask(context, ['uidCheck'], function(callback, results) {
                if (!results.details.pb_version) {
                    // pb version was not specified
                    // assumes plugin is compatible with all pb versions
                    pb.log.warn('PluginInitializationService:[%s] The plugin does not specify a pb version.', results.details.uid);
                    return callback();
                }

                var err = null;
                if (!semver.satisfies(pb.config.version, results.details.pb_version)) {
                    err = new Error('PB version '+pb.config.version+' does not satisfy plugin version expression '+results.details.pb_version+'for plugin '+results.details.uid);
                }
                callback(err);
            });
        }

        /**
         * @static
         * @method getValidationErrorsHandler
         * @param {object} context
         * @param {PluginInitializationService} context.pluginInitializationService
         * @param {PluginService} context.pluginService
         * @param {object} context.cachedPlugin
         * @param {boolean} context.isCachedPlugin
         * @param {string} context.site
         * @param {object} context.plugin
         * @returns {Array}
         */
        static getValidationErrorsHandler (context) {
            return PluginInitializationService.buildNoActionOnCachedTask(context, ['details'], function(callback, results) {
                var validationService = new pb.PluginValidationService({});
                validationService.validate(results.details, {}, callback);
            });
        }

        /**
         * @static
         * @method getPluginCacheSyncHandler
         * @param {object} context
         * @param {PluginInitializationService} context.pluginInitializationService
         * @param {PluginService} context.pluginService
         * @param {object} context.cachedPlugin
         * @param {boolean} context.isCachedPlugin
         * @param {string} context.site
         * @param {object} context.plugin
         * @returns {Array}
         */
        static getPluginCacheSyncHandler (context) {
            return PluginInitializationService.buildNoActionOnCachedTask(context, ['syncSettings'], function(callback, results) {
                context.pluginInitializationService.pluginCache[context.plugin.uid].details = results.details;
                context.plugin.dependencies = results.details.dependencies;
                context.plugin.bowerDependencies = results.details.bowerDependencies;
                callback();
            });
        }

        /**
         * @static
         * @method getSyncSettingsHandler
         * @param {object} context
         * @param {PluginInitializationService} context.pluginInitializationService
         * @param {PluginService} context.pluginService
         * @param {object} context.cachedPlugin
         * @param {boolean} context.isCachedPlugin
         * @param {string} context.site
         * @param {object} context.plugin
         * @returns {Array}
         */
        static getSyncSettingsHandler (context) {
            return ['versionCheck', function(callback, results) {
                context.pluginService.syncSettings(context.plugin, results.details, callback);
            }];
        }

        /**
         * @static
         * @method getLoadMainModuleHandler
         * @param {object} context
         * @param {PluginInitializationService} context.pluginInitializationService
         * @param {PluginService} context.pluginService
         * @param {object} context.cachedPlugin
         * @param {boolean} context.isCachedPlugin
         * @param {string} context.site
         * @param {object} context.plugin
         * @returns {Array}
         */
        static getLoadMainModuleHandler (context) {
            return ['npmDependencyCheck', 'bowerDependencyCheck', function(callback, results) {

                //convert perm array to hash
                var map = {};
                if (context.plugin.permissions) {

                    Object.keys(context.plugin.permissions).forEach(function(role) {
                        map[role] = util.arrayToHash(context.plugin.permissions[role]);
                    });
                }
                else {
                    pb.log.debug('PluginInitializationService:[%s] Skipping permission set load. None were found.', context.plugin.uid);
                }

                //create cached active plugin structure
                var templates = null;
                if (results.details.theme && results.details.theme.content_templates) {
                    templates = results.details.theme.content_templates;
                    templates.forEach(function(template) {
                        template.theme_name = results.details.name;
                    });
                }

                var mainModule = PluginService.loadMainModule(context.plugin.uid, results.details.main_module.path);
                if (!mainModule) {
                    return callback(new Error('Failed to load main module for plugin '+context.plugin.uid+' at '+results.details.main_module.path));
                }

                context.pluginSpec = {
                    main_module: mainModule,
                    public_dir: PluginService.getPublicPath(results.details.uid),
                    permissions: map,
                    templates: templates,
                    icon: results.details.icon ? PluginService.genPublicPath(context.plugin.uid, results.details.icon) : undefined
                };
                callback();
            }];
        }

        /**
         * @static
         * @method getOnStartupHandler
         * @param {object} context
         * @param {PluginInitializationService} context.pluginInitializationService
         * @param {PluginService} context.pluginService
         * @param {object} context.cachedPlugin
         * @param {boolean} context.isCachedPlugin
         * @param {string} context.site
         * @param {object} context.plugin
         * @returns {Array}
         */
        static getOnStartupHandler (context) {
            return ['loadMainModule', function(callback/*, results*/) {

                var mainModule = context.pluginSpec.main_module;
                if (!util.isFunction(mainModule.onStartupWithContext) && !util.isFunction(mainModule.onStartup)) {
                    return callback(new Error('Plugin '+context.plugin.uid+' did not provide an "onStartupWithContext" function.'));
                }

                var timeoutProtect = setTimeout(function() {

                    // Clear the local timer variable, indicating the timeout has been triggered.
                    timeoutProtect = null;
                    callback(new Error("Startup function for plugin "+context.plugin.uid+" never called back!"));

                }, 2000);

                //create the domain to protect against rogue plugins
                var d = domain.create();

                //create the finally block.  We'll cleanup all listeners and trigger the callback
                var onDone = function(err) {
                    d.removeAllListeners('error');
                    callback(err);
                };

                //provide a callback for the module to execute.
                var startupCallback = function(err) {
                    if (timeoutProtect) {
                        clearTimeout(timeoutProtect);
                        onDone(err);
                    }
                };

                //add an error handler that will clear the timeout if exists, otherwise we assume that the timeout has
                // already executed and the module was too late
                d.once('error', function(err) {
                    if (timeoutProtect) {
                        clearTimeout(timeoutProtect);
                        onDone(err, false);
                    }
                });
                d.run(function () {

                    //check to see if main modules are instance based
                    if (util.isFunction(mainModule.prototype.onStartup)) {
                        mainModule = new mainModule(context.site);
                    }
                    if (util.isFunction(mainModule.onStartupWithContext)) {
                        mainModule.onStartupWithContext({site: context.site}, startupCallback);
                    }
                    else {
                        mainModule.onStartup(startupCallback);
                    }
                });
            }];
        }

        /**
         * @static
         * @method getLoadServicesHandler
         * @param {object} context
         * @param {PluginInitializationService} context.pluginInitializationService
         * @param {PluginService} context.pluginService
         * @param {object} context.cachedPlugin
         * @param {boolean} context.isCachedPlugin
         * @param {string} context.site
         * @param {object} context.plugin
         * @returns {Array}
         */
        static getLoadServicesHandler (context) {
            return ['onStartup', function(callback, results) {

                //don't go through initializing services because we already looked them up
                if(context.cachedPlugin && context.cachedPlugin.services) {
                    context.pluginSpec.services = context.cachedPlugin.services;
                    return callback(null, true);
                }

                //plugin wasn't cached so go lookup all the services
                var service = new pb.PluginServiceLoader({pluginUid: context.plugin.uid});
                service.getAll({}, function(err, services) {
                    if (util.isError(err)) {
                        pb.log.debug("PluginInitializationService:[%s] No services directory was found", context.plugin.uid);
                    }
                    if (!services) {
                        pb.log.debug("PluginInitializationService:[%s] No services were found", context.plugin.uid);
                        services = {};
                    }
                    context.pluginSpec.services = services;
                    context.plugin.services = services;
                    callback(null, !util.isError(err));
                });
            }];
        }

        /**
         * @static
         * @method getSetActiveHandler
         * @param {object} context
         * @param {PluginInitializationService} context.pluginInitializationService
         * @param {PluginService} context.pluginService
         * @param {object} context.cachedPlugin
         * @param {boolean} context.isCachedPlugin
         * @param {string} context.site
         * @param {object} context.plugin
         * @returns {Array}
         */
        static getSetActiveHandler (context) {
            return ['loadServices', function(callback/*, results*/) {
                callback(null, PluginService.activatePlugin(context.plugin.uid, context.pluginSpec, context.site));
            }];
        }

        /**
         * @static
         * @method getLoadRoutesHandler
         * @param {object} context
         * @param {PluginInitializationService} context.pluginInitializationService
         * @param {PluginService} context.pluginService
         * @param {object} context.cachedPlugin
         * @param {boolean} context.isCachedPlugin
         * @param {string} context.site
         * @param {object} context.plugin
         * @returns {Array}
         */
        static getLoadRoutesHandler (context) {
            return ['setActive', function(callback/*, results*/) {
                var controllerLoader = new pb.PluginControllerLoader({pluginUid: context.plugin.uid, site: context.site});
                controllerLoader.getAll({register: true}, callback);
            }];
        }

        /**
         * @static
         * @method getLoadLocalizationsHandler
         * @param {object} context
         * @param {PluginInitializationService} context.pluginInitializationService
         * @param {PluginService} context.pluginService
         * @param {object} context.cachedPlugin
         * @param {boolean} context.isCachedPlugin
         * @param {string} context.site
         * @param {object} context.plugin
         * @returns {Array}
         */
        static getLoadLocalizationsHandler (context) {
            return ['setActive', function(callback/*, results*/) {
                var service = new pb.PluginLocalizationLoader({pluginUid: context.plugin.uid, site: context.site});
                service.getAll({register: true}, callback);
            }];
        }

        /**
         * Builds out an empty handler by taking the array of dependencies attached and appending an empty function
         * that callback without error or result.
         * @static
         * @method getEmptyTaskSpec
         * @param {Array} dependencies
         * @return {Array}
         */
        static getEmptyTaskSpec (dependencies) {
            dependencies.push(function(callback) { callback(); });
            return dependencies;
        }

        /**
         * Checks the context to see if the plugin has already been processed once (cached).  If yes, then an "empty"
         * task that only executes the callback is provided.
         * @param {object} context
         * @param {object} [context.cachedPlugin]
         * @param {Array} taskSpec The array of string dependencies.  Each string represents a task that must be
         * completed before this task can execute
         * @param {function} handler (function, object)
         * @returns {Array}
         */
        static buildNoActionOnCachedTask (context, taskSpec, handler) {
            if (!!context.cachedPlugin) {
                return PluginInitializationService.getEmptyTaskSpec(taskSpec);
            }
            taskSpec.push(handler);
            return taskSpec;
        }

        /**
         * Handles an initialization error by ensuring that the plugin is not active and that all errors are logged,
         * including validation errors from the details.json file on disk
         * @static
         * @method handleInitializationError
         * @param {object} plugin
         * @param {string} plugin.uid
         * @param {string} plugin.site
         * @param {Error} err
         */
        static handleInitializationError (plugin, err) {
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
    }

    //private static variables
    /**
     * A mapping of task names to task handlers that when executed and provided a context will create a task spec
     * containing the task's dependencies (other registered tasks) and a handler function.
     * @private
     * @static
     * @readonly
     * @property registeredTasks
     * @type {object}
     */
    var registeredTasks = {
        details: PluginInitializationService.getDetailsHandler,
        validationErrors: PluginInitializationService.getValidationErrorsHandler,
        validationOutput: PluginInitializationService.getValidationOutputHandler,
        uidCheck: PluginInitializationService.getUidCheckHandler,
        npmDependencyCheck: PluginInitializationService.getNpmDependencyCheckHandler,
        bowerDependencyCheck: PluginInitializationService.getBowerDependencyCheckHandler,
        versionCheck: PluginInitializationService.getVersionCheckHandler,
        pluginCacheSync: PluginInitializationService.getPluginCacheSyncHandler,
        syncSettings: PluginInitializationService.getSyncSettingsHandler,
        loadMainModule: PluginInitializationService.getLoadMainModuleHandler,
        onStartup: PluginInitializationService.getOnStartupHandler,
        loadServices: PluginInitializationService.getLoadServicesHandler,
        setActive: PluginInitializationService.getSetActiveHandler,
        loadRoutes: PluginInitializationService.getLoadRoutesHandler,
        loadLocalization: PluginInitializationService.getLoadLocalizationsHandler
    };

    return PluginInitializationService;
};
