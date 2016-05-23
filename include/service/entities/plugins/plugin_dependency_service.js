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

//dependencies
var async = require('async');

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;

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
     * @param {object} options
     * @param {Function} cb
     */
    PluginDependencyService.prototype.hasDependencies = function(plugin, options, cb) {
        throw new Error('This function must overriden by the inheriting prototype');
    };

    PluginDependencyService.prototype.isSatisfied = function(context, cb) {
        throw new Error('This function must overriden by the inheriting prototype');
    };

    PluginDependencyService.prototype.installAll = function(plugin, options, cb) {
        async.series([
            util.wrapTask(this, this.acquireLock, [plugin.uid]),
            util.wrapTask(this, this._installAll, [plugin, options])
        ],
        PluginDependencyService.getLockRelease(cb));
    };

    PluginDependencyService.prototype._installAll = function(plugin, options, cb) {
        throw new Error('This function must overriden by the inheriting prototype');
    };

    PluginDependencyService.prototype.install = function(context, cb) {
        var self = this;
        var isSatisfiedFunc = function(cb) {
            if (context.skipValidation) {
                return cb(null, true);
            }
            self.isSatisfied(context, function(err, result) {
                cb(err, result ? result.success : false);
            });
        };

        isSatisfiedFunc(function(err, isSatisfied) {
            if (util.isError(err)) {
                return cb(err, isSatisfied);
            }
            if (isSatisfied) {
                return cb(null, true);
            }

            //perform the install
            self._install(context, cb);
        });
    };

    PluginDependencyService.prototype._install = function(context, cb) {
        throw new Error('This function must overriden by the inheriting prototype');
    };

    PluginDependencyService.prototype.acquireLock = function(pluginUid, cb) {
        var type = typeof this;
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

    PluginDependencyService.getLockRelease = function(cb) {
        return function(err, result) {
            var context = result[0];
            if (!context || !context.didLock) {
                return cb(err, result);
            }
            context.lockService.release(context.lockKey, function(error, didRelease) {
                cb(err || error, didRelease);
            });
        };
    };

    PluginDependencyService.getLockCondition = function(context) {
        return function() {
            return context.didLock || context.retryCount >= context.maxCount;
        };
    };

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
     * @param {boolean} success
     * @param {Array} [validationFailures]
     * @returns {{success: boolean, validationFailures: Array}}
     */
    PluginDependencyService.buildResult = function(success, validationFailures) {
        return {
            success: !!success,
            validationErrors: validationFailures || []
        };
    };

    PluginDependencyService.getLockKey = function(type, pluginUid) {
        return pb.ServerRegistration.generateServerKey() + ':' + pluginUid + ':' + type + ':dependency:install';
    };

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
