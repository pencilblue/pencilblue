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
var _ = require('lodash');

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;
    var log = pb.log;

    /**
     * @class PluginDependencyService
     * @constructor
     */
    function PluginDependencyService(){}

    /**
     * The maximum number of retries to acquire
     * @private
     * @static
     * @readonly
     * @property MAX_DEPENDENCY_LOCK_RETRY_CNT
     * @type {Integer}
     */
    var MAX_DEPENDENCY_LOCK_RETRY_CNT = 45;

    /**
     * Verifies that a plugin has all of the required dependencies installed from NPM
     * @method hasDependencies
     * @param {Object} plugin
     * @param {string} plugin.uid
     * @param {object} options
     * @param {Function} cb
     */
    PluginDependencyService.prototype.hasDependencies = function(plugin, options, cb) {
        throw new Error('This function must overriden by the inheriting prototype');
    };

    /**
     * Inspects each dependency to see if it is already installed for the plugin or the platform.
     * @param {object} dependencies Key value pairs of moduleName => versionExpression
     * @param {object} context
     * @param {string} context.pluginUid
     * @param cb (Error, Array({{success: boolean, validationFailures: Array}}))
     */
    PluginDependencyService.prototype.areSatisfied = function(dependencies, context, cb) {
        var self = this;
        var tasks = util.getTasks(Object.keys(dependencies), function(keys, i) {

            var ctx = {
                pluginUid: context.pluginUid,
                moduleName: keys[i],
                versionExpression: dependencies[keys[i]]
            };
            return util.wrapTask(self, self.isSatisfied, [ctx]);
        });
        async.series(tasks, cb);
    };

    /**
     * Inspects a hash of dependencies looking to see which ones are available for the specified plugin.  Those that are
     * not available are in a new hash that is part of the callback
     * @method filterSatisfied
     * @param dependencies
     * @param {object}options
     * @param {function} cb (Error, object)
     */
    PluginDependencyService.prototype.filterSatisfied = function(dependencies, options, cb) {
        async.waterfall([
            util.wrapTask(this, this.areSatisfied, [dependencies, {pluginUid: options.pluginUid}]),
            function(resultArray, callback) {
                var unsatisfiedObj = resultArray.reduce(function(unsatisfied, result) {
                    if (!result.success) {
                        unsatisfied[result.moduleName] = dependencies[result.moduleName];
                    }
                    return unsatisfied;
                }, {});
                callback(null, unsatisfiedObj);
            }
        ], cb);
    };

    /**
     * <b>NOTE: This function must be overriden by the inheriting prototype</b>
     * Checks to see if the plugin dependency is already installed
     * @method isSatisfied
     * @param {object} context
     * @param {string} context.moduleName
     * @param {string} context.versionExpression
     * @param {string} context.pluginUid
     * @param {function} cb (Error, {{moduleName: string, success: boolean, validationFailures: Array}})
     */
    PluginDependencyService.prototype.isSatisfied = function(context, cb) {
        throw new Error('This function must overriden by the inheriting prototype');
    };

    /**
     * Ensures that all plugin dependencies of the type supported by the inheriting prototype are installed for the
     * given plugin.  The function will acquire a lock (semaphore) to prevent other processes from causing concurrency
     * issues then proceed with the installation
     * @method installAll
     * @param {object} dependencies
     * @param {object} options
     * @param {string} options.pluginUid The plugin identifier
     * @param {boolean} [options.skipValidation=false]
     * @param {function} cb (Error, Boolean)
     */
    PluginDependencyService.prototype.installAll = function(dependencies, options, cb) {
        var self = this;
        async.auto({

            //get the lock so no other process can screw us over by writing to the same file in parallel
            lockContext: util.wrapTask(this, this.acquireLock, [options.pluginUid]),

            //create a dependency list of only those that are unsatisfied, unless explicitly told to skip the validation
            unsatisfiedDependencies: ['lockContext', function(callback) {
                if (options.skipValidation) {
                    log.silly('PluginDependencyService: Skipping %s dependency validation for plugin %s', self.getType(), options.pluginUid);
                    return callback(null, dependencies);
                }

                log.silly('PluginDependencyService: Filtering satisfied %s dependencies for plugin %s', self.getType(), options.pluginUid);
                self.filterSatisfied(dependencies, {pluginUid: options.pluginUid}, callback);
            }],

            //configure the module that will handle the dependencies such that it is specific to the provided plugin
            configuration: ['unsatisfiedDependencies', function(callback, results) {
                //when there are no unsatisfied dependencies then callback to break the chain
                if (_.isEqual(results.unsatisfiedDependencies, {})) {
                    log.silly('PluginDependencyService: All %s dependencies for plugin %s are satisfied', self.getType(), options.pluginUid);
                    return callback(true);
                }

                log.silly('PluginDependencyService: Configuring %s for plugin %s', self.getType(), options.pluginUid);
                self.configure(options, callback);
            }],

            //perform the installation
            install: ['unsatisfiedDependencies', 'configuration', function(callback, results) {
                log.silly('PluginDependencyService: Installing unsatisfied %s dependencies: %s', self.getType(), JSON.stringify(results.unsatisfiedDependencies));
                self._installAll(results.unsatisfiedDependencies, util.merge(options, {configuration: results.configuration}), callback);
            }]
        },
        PluginDependencyService.getLockRelease(cb));
    };

    /**
     * <b>This method must be implemented by an inheriting prototype</b>
     * Responsible for ensuring that all dependencies for a plugin are installed.  Implementations are intended to
     * iterate over each of dependency specified for the plugin and call the "install" function for each one.
     * @private
     * @method _installAll
     * @param {object} dependencies
     * @param {object} options
     * @param {string} options.pluginUid The plugin identifier
     * @param {object} options.configuration
     * @param {function} cb (Error, Boolean)
     */
    PluginDependencyService.prototype._installAll = function(dependencies, options, cb) {
        throw new Error('This function must overriden by the inheriting prototype');
    };

    /**
     * Configures Bower to emit log statements as well as set the installation directory for the plugin.
     * @static
     * @method configure
     * @param {object} options
     * @param {string} options.pluginUid
     * @param {function} cb (Error, {logOutput: Array, logListener: function})
     */
    PluginDependencyService.prototype.configure = function(options, cb) {
        throw new Error('This function must overriden by the inheriting prototype');
    };

    /**
     * Responsible for installing the individual dependency.  The function, by default, checks to see if the dependency
     * has already been installed.  If yes, the function calls back after the existence check.  When the dependency is
     * not available it proceeds with the installation
     * @method install
     * @param {object} context
     * @param {string} context.pluginUid The plugin identifier
     * @param {string} context.moduleName The name of the dependent module to install
     * @param {string} context.versionExpression The version or version expression to use for installation
     * @param {boolean} [context.skipValidation=false]
     * @param {function} cb (Error, Boolean)
     */
    PluginDependencyService.prototype.install = function(context, cb) {
        var dependencies = {};
        dependencies[context.moduleName] = context.versionExpression;
        this.installAll(dependencies, context, cb);
    };

    /**
     * Acquires the semaphore needed in order to use the singleton NPM instance on the server.  This protects multiple
     * PB child processes from causing write locks in the same directories.
     * @param {string} pluginUid
     * @param {function} cb (Error, Object)
     */
    PluginDependencyService.prototype.acquireLock = function(pluginUid, cb) {
        var type = this.getType();
        var context = {
            type: type,
            didLock: false,
            retryCount: 0,
            maxCount: MAX_DEPENDENCY_LOCK_RETRY_CNT,
            lockKey: PluginDependencyService.getLockKey(type, pluginUid),
            lockService: new pb.LockService(),
            interval: 1000
        };
        async.until(PluginDependencyService.getLockCondition(context), PluginDependencyService.getLockIteration(context), function(err) {
            cb(err, context);
        });
    };

    /**
     * <b>This method must be implemented by an inheriting prototype</b>
     * Responsible for describing the type of dependency represented.  This helps with identifying lock keys and
     * instance types.
     * @method getType
     * @return {string}
     */
    PluginDependencyService.prototype.getType = function() {
        throw new Error('This function must overriden by the inheriting prototype');
    };

    /**
     * Creates a function that knows how to extract the context from the provided result set and inspect it to see if
     * the lock was successfully acquired.  If the lock was acquired it is released before calling back
     * @static
     * @method getLockRelease
     * @param {function} cb
     * @returns {Function}
     */
    PluginDependencyService.getLockRelease = function(cb) {
        return function(err, result) {
            var context = result ? result.lockContext : null;
            if (!context || !context.didLock) {
                return cb(err, result);
            }
            context.lockService.release(context.lockKey, function(error, didRelease) {
                var e = (util.isError(err) ? err : null) || error;
                cb(e, didRelease);
            });
        };
    };

    /**
     * Creates a function that is used to determine if the async loop for lock acquisition should continue
     * @static
     * @method getLockCondition
     * @param {object} context
     * @param {boolean} context.didLock Indicates if the lock was successfully acquired in the last attempt
     * @param {integer} context.retryCount The current number of times we've attempted to acquire the lock
     * @param {integer} context.maxCount The maximum number of retries
     * @returns {Function}
     */
    PluginDependencyService.getLockCondition = function(context) {
        return function() {
            return context.didLock || context.retryCount >= context.maxCount;
        };
    };

    /**
     * Creates a task function who's responsibility is to acquire a semaphore for dependency installation.  The task
     * will attempt to create the lock.  On acquisition, the function will callback immediately after setting the
     * didLock property on the context.  On failure, the function calls back immediately with the error.  When the lock
     * already exists the function will wait the specified interval provided in the context before calling back.
     * @static
     * @method getLockIteration
     * @param {object} context
     * @param {string} context.lockKey
     * @param {boolean} context.didLock
     * @param {integer} context.retryCount
     * @param {integer} context.interval Time in milliseconds to sleep before calling back when the semaphore has
     * already been created.
     * @returns {Function}
     */
    PluginDependencyService.getLockIteration = function(context) {
        return function(callback) {

            //try and acquire the lock
            context.lockService.acquire(context.lockKey, function(err, reply) {
                if (util.isError(err)) {
                    return callback(err);
                }
                if (reply) {
                    context.didLock = true;
                    return callback();
                }

                //wait a second to see if anything changes
                context.retryCount++;
                pb.log.silly('PluginDependencyService: Failed to acquire %s dependency installation lock for the %s time. Waiting for 1000ms.', context.type, context.retryCount);
                setTimeout(function() {

                    //now check to see if another process installed the
                    //dependencies.  If there is no plugin object then skip.
                    callback();
                }, context.interval);
            });
        };
    };

    /**
     * Constructs an object that will be returned as the result for the dependency install operation
     * @static
     * @method buildResult
     * @param {string} moduleName
     * @param {boolean} success
     * @param {Array} [validationFailures]
     * @returns {{success: boolean, validationFailures: Array, moduleName: string}}
     */
    PluginDependencyService.buildResult = function(moduleName, success, validationFailures) {
        return {
            success: !!success,
            validationErrors: validationFailures || [],
            moduleName: moduleName
        };
    };

    /**
     * Generates a semaphore key for the operation to install dependencies.
     * @method getLockKey
     * @param {string} type
     * @param {string} pluginUid
     * @returns {string}
     */
    PluginDependencyService.getLockKey = function(type, pluginUid) {
        return pb.ServerRegistration.generateServerKey() + ':' + pluginUid + ':' + type + ':dependency:install';
    };

    /**
     * Creates a function capable of reducing the dependency installation errors down to a single boolean result.
     * In addition, it logs each validation message that is incurred
     * @method getResultReducer
     * @param {string} pluginUid
     * @param {function} cb
     * @returns {function}
     */
    PluginDependencyService.getResultReducer = function(pluginUid, cb) {
        return function(err, results) {
            var result = true;
            if (util.isArray(results)) {

                results.forEach(function(obj) {

                    result = result && obj.success;
                    obj.validationErrors.forEach(function(validationErr) {
                        pb.log.warn('PluginDependencyService:[%s] %s', pluginUid, validationErr.message);
                    });
                });
            }
            cb(err, result);
        };
    };

    return PluginDependencyService;
};
