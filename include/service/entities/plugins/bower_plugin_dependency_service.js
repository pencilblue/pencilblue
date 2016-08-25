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
var bower = require('bower');
var semver = require('semver');
var async = require('async');
var path = require('path');

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;
    var PluginService = pb.PluginService;
    var BaseObjectService = pb.BaseObjectService;
    var PluginDependencyService = pb.PluginDependencyService;

    /**
     * Provides methods to ensure that bower dependencies are available to plugins
     * @class BowerPluginDependencyService
     * @constructor
     * @extends PluginDependencyService
     */
    function BowerPluginDependencyService(){}
    util.inherits(BowerPluginDependencyService, PluginDependencyService);

    /**
     * Responsible for describing the type of dependency represented.  This helps with identifying lock keys and
     * instance types.
     * @method getType
     * @return {string} 'bower'
     */
    BowerPluginDependencyService.prototype.getType = function() {
        return 'bower';
    };

    /**
     * Verifies that a plugin has all of the required dependencies installed from Bower
     * @method hasDependencies
     * @param {Object} plugin
     * @param {string} plugin.uid
     * @param {object} plugin.bowerDependencies
     * @param {object} options
     * @param {Function} cb (Error, Boolean)
     */
    BowerPluginDependencyService.prototype.hasDependencies = function(plugin, options, cb) {
        if (!util.isObject(plugin.bowerDependencies) || plugin.bowerDependencies === {}) {
            //no dependencies were declared so we're good
            return cb(null, true);
        }

        var context = {
            pluginUid: plugin.uid
        };
        this.areSatisfied(plugin.bowerDependencies, context, PluginDependencyService.getResultReducer(plugin.uid, cb));
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
    BowerPluginDependencyService.prototype.isSatisfied = function(context, cb) {

        //get the paths necessary
        var possiblePaths = [
            BowerPluginDependencyService.getPluginPathToBowerJson(context.pluginUid, context.moduleName),
            BowerPluginDependencyService.getRootPathToBowerJson(context.moduleName)
        ];

        //iterate over possible locations for the module
        var dependencyFound = false;
        for (var j = 0; j < possiblePaths.length; j++) {

            //ensure that the version expression specified by the
            //dependency is satisfied by that provided by the package.json
            var jsonObj = null;
            try {
                jsonObj = require(possiblePaths[j]);
            }
            catch (e) {
                continue;
            }
            if ( (dependencyFound = semver.satisfies(jsonObj.version, context.versionExpression)) ) {
                break;
            }
        }

        //compile validation errors
        var validationErrors = [];
        if (!dependencyFound) {
            validationErrors.push(BaseObjectService.validationFailure(context.moduleName,
                'Failed to find an existing bower module to satisfy dependency '+context.moduleName+':'+context.versionExpression));
        }

        //build validation errors
        var result = PluginDependencyService.buildResult(context.moduleName, dependencyFound, validationErrors);
        process.nextTick(function() {
            cb(null, result);
        });
    };

    /**
     * Responsible for ensuring that all dependencies for a plugin are installed by iterating over the "bowerDependencies"
     * property of the plugin.  Each iteration calls the "install" function
     * @private
     * @method _installAll
     * @param {object} dependencies
     * @param {object} options
     * @param {string} options.pluginUid
     * @param {object} options.configuration
     * @param {function} cb (Error, Boolean)
     */
    BowerPluginDependencyService.prototype._installAll = function(dependencies, options, cb) {

        var command = Object.keys(dependencies).map(function(moduleName) {
            return moduleName+'#'+dependencies[moduleName];
        });
        bower.commands.install(command, {save: false}, options.configuration.bowerRc)
            .on('log', options.configuration.logListener)
            .once('end', function(result) {
                cb(null, {result: result, logOutput: options.configuration.logOutput});
            })
            .once('error', cb);
    };

    /**
     * Configures Bower to emit log statements as well as set the installation directory for the plugin.
     * @static
     * @method configure
     * @param {object} options
     * @param {object} options.pluginUid
     * @param {function} cb (Error, {logOutput: Array, logListener: function, bowerRc: object})
     */
    BowerPluginDependencyService.prototype.configure = function(options, cb) {
        var bowerRc = {
            directory: path.join(PluginService.getPluginsDir(), options.pluginUid, 'public', 'bower_components'),
            ignoredDependencies: []
        };
        bower.commands.list().on('end', function(list) {

            //add pencilblue bower dependencies to ignored dependency list, because we do not want to have them installed in the plugins bower_components folder
            util.forEach(list.pkgMeta.dependencies, function (packageVersion, packageName) {
                bowerRc.ignoredDependencies.push(packageName);
            });

            //prepare a context object
            var statements = [];
            var context = {
                logOutput: statements,
                logListener: function(message) {
                    statements.push(message);
                },
                bowerRc: bowerRc
            };
            cb(null, context);
        })
        .once('error', cb);
    };

    /**
     * Generates the path to a Bower module for the specified plugin
     * @static
     * @method getPluginPathToBowerJson
     * @param {string} pluginUid
     * @param {string} bowerPackageName
     * @return {string} An absolute path
     */
    BowerPluginDependencyService.getPluginPathToBowerJson = function(pluginUid, bowerPackageName) {
        return path.join(PluginService.getPluginsDir(), pluginUid, 'public', 'bower_components', bowerPackageName, '.bower.json');
    };

    /**
     * Generates the path to a Bower module for the platform
     * @static
     * @method getRootPathToBowerJson
     * @param {string} bowerPackageName
     * @return {string} An absolute path
     */
    BowerPluginDependencyService.getRootPathToBowerJson = function(bowerPackageName) {
        return path.join(pb.config.docRoot, 'public', 'bower_components', bowerPackageName, '.bower.json');
    };

    return BowerPluginDependencyService;
};
