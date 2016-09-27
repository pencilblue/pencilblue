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
var npm = require('npm');
var semver = require('semver');
var path = require('path');

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;
    var PluginService = pb.PluginService;
    var BaseObjectService = pb.BaseObjectService;
    var PluginDependencyService = pb.PluginDependencyService;

    /**
     * @class NpmPluginDependencyService
     * @constructor
     * @extends PluginDependencyService
     */
    function NpmPluginDependencyService(){}
    util.inherits(NpmPluginDependencyService, PluginDependencyService);

    /**
     * Responsible for describing the type of dependency represented.  This helps with identifying lock keys and
     * instance types.
     * @method getType
     * @return {string} 'npm'
     */
    NpmPluginDependencyService.prototype.getType = function() {
        return 'npm';
    };

    /**
     * Verifies that a plugin has all of the required dependencies installed from NPM
     * @method hasDependencies
     * @param {Object} plugin
     * @param {string} plugin.uid
     * @param {object} plugin.dependencies
     * @param {object} options
     * @param {Function} cb (Error, Boolean)
     */
    NpmPluginDependencyService.prototype.hasDependencies = function(plugin, options, cb) {
        if (!util.isObject(plugin.dependencies) || plugin.dependencies === {}) {
            //no dependencies were declared so we're good
            return cb(null, true);
        }

        var context = {
            pluginUid: plugin.uid
        };
        this.areSatisfied(plugin.dependencies, context, PluginDependencyService.getResultReducer(plugin.uid, cb));
    };

    /**
     * Checks to see if the module exists and its package definition is available.  It will first check the root level
     * (installation directory's node_modules folder) then inspect the node_modules directory for the plugin.  In
     * addition to existence one of the paths must satisfy the version expression provided for the dependency
     * @method isSatisfied
     * @param {object} context
     * @param {string} context.moduleName
     * @param {string} context.versionExpression
     * @param {string} context.pluginUid
     * @param {function} cb (Error, {{success: boolean, validationFailures: Array}})
     */
    NpmPluginDependencyService.prototype.isSatisfied = function(context, cb) {

        //get the paths necessary
        var possiblePaths = [
            NpmPluginDependencyService.getPluginPathToPackageJson(context.pluginUid, context.moduleName),
            NpmPluginDependencyService.getRootPathToPackageJson(context.moduleName)
        ];

        //iterate over possible locations for the module
        var dependencyFound = false;
        for (var j = 0; j < possiblePaths.length; j++) {

            //ensure that the version expression specified by the
            //dependency is satisfied by that provided by the package.json
            var packageJson = null;
            try {
                packageJson = require(possiblePaths[j]);
            }
            catch (e) {
                continue;
            }
            if ( (dependencyFound = semver.satisfies(packageJson.version, context.versionExpression)) ) {
                break;
            }
        }

        //compile validation errors
        var validationErrors = [];
        if (!dependencyFound) {
            validationErrors.push(BaseObjectService.validationFailure(context.moduleName,
                'Failed to find an existing module to satisfy dependency '+context.moduleName+':'+context.versionExpression));
        }

        //build validation errors
        var result = PluginDependencyService.buildResult(context.moduleName, dependencyFound, validationErrors);
        process.nextTick(function() {
            cb(null, result);
        });
    };

    /**
     * Responsible for ensuring that all dependencies for a plugin are installed by iterating over the "dependencies"
     * property of the plugin.  Each iteration calls the "install" function
     * @private
     * @method _installAll
     * @param {object} dependencies
     * @param {object} options
     * @param {string} options.pluginUid The plugin identifier
     * @param {object} options.configuration
     * @param {function} cb (Error, Boolean)
     */
    NpmPluginDependencyService.prototype._installAll = function(dependencies, options, cb) {

        var command = Object.keys(dependencies).map(function(moduleName) {
            return moduleName+'@'+dependencies[moduleName];
        });
        npm.commands.install(command, function(err, result) {
            npm.removeListener('log', options.configuration.logListener);

            cb(err, {result: result, logOutput: options.configuration.logOutput});
        });
    };

    /**
     * Configures NPM to emit log statements as well as set the installation directory for the plugin.
     * @static
     * @method configure
     * @param {object} options
     * @param {string} options.pluginUid
     * @param {function} cb (Error, Object)
     */
    NpmPluginDependencyService.prototype.configure = function(options, cb) {

        //ensure the node_modules directory exists
        var prefixPath = path.join(PluginService.getPluginsDir(), options.pluginUid);

        //log and load
        var config = {
            prefix: prefixPath
        };
        npm.load(config, function(err) {
            if (util.isError(err)) {
                return cb(err);
            }

            //prepare a context object
            var statements = [];
            var context = {
                logOutput: statements,
                logListener: function(message) {
                    statements.push(message);
                }
            };

            //we set the prefix manually here.  See:
            //https://github.com/pencilblue/pencilblue/issues/214
            //this is a hack to keep it working until the npm team can decouple the
            //npmconf module from npm and create a scenario where it can be reloaded.
            npm.on('log', context.logListener);
            npm.config.prefix = prefixPath;

            cb(err, context);
        });
    };

    /**
     * Generates the path to a NPM module for the specified plugin
     * @static
     * @method getPluginPathToPackageJson
     * @param {string} pluginUid
     * @param {string} npmPackageName
     * @return {string} An absolute path
     */
    NpmPluginDependencyService.getPluginPathToPackageJson = function(pluginUid, npmPackageName) {
        return path.join(PluginService.getPluginsDir(), pluginUid, 'node_modules', npmPackageName, 'package.json');
    };

    /**
     * Generates the path to a NPM module for the platform
     * @static
     * @method getPluginPathToPackageJson
     * @param {string} npmPackageName
     * @return {string} An absolute path
     */
    NpmPluginDependencyService.getRootPathToPackageJson = function(npmPackageName) {
        return path.join(pb.config.docRoot, 'node_modules', npmPackageName, 'package.json');
    };

    /**
     * Loads a module dependency for the specified plugin.  The function will attempt to load it from the plugin
     * specific node_modules directory.  If not found, or invalid, the function will attempt to load it from the PB
     * node_modules directory.  When the module cannot be found in either location an error is thrown
     * @static
     * @method require
     * @param {String} pluginUid The plugin identifier
     * @param {String} moduleName The name of the NPM module to load
     * @return {*} The entity returned by the "require" call.
     */
    NpmPluginDependencyService.require = function(pluginUid, moduleName) {
        var modulePath = null;
        try {
            modulePath = path.join(PluginService.getPluginsDir(), pluginUid, 'node_modules', moduleName);
            return require(modulePath);
        }
        catch(e) {
            pb.log.debug('NpmPluginDependencyService:%s Failed to find module %s at path %s.  Attempting to retrieve from PB context: %s',
                pluginUid, moduleName, modulePath, e.stack);
        }
        return require(moduleName);
    };

    return NpmPluginDependencyService;
};
