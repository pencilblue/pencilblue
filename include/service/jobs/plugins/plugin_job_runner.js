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
var util = require('../../../util.js');

module.exports = function PluginJobRunnerModule(pb) {

    /**
     * The framework for a cluster wide job that affects 1 or more plugins.
     * @class PluginJobRunner
     * @constructor
     * @extends ClusterJobRunner
     */
    function PluginJobRunner() {
        PluginJobRunner.super_.call(this);

        /**
         *
         * @property pluginService
         * @type {PluginService}
         */
        this.pluginService = new pb.PluginService();
    }
    util.inherits(PluginJobRunner, pb.ClusterJobRunner);

    /**
     * The unique identifier of the plugin to be uninstalled
     * @property pluginUid
     * @type {String}
     */
    PluginJobRunner.prototype.pluginUid = '';

    /**
     * Sets the unique plugin identifier for the plugin to be uninstalled
     * @method setPluginUid
     * @param {String} The plugin identifier
     * @return {PluginUninstallJob} This instance
     */
    PluginJobRunner.prototype.setPluginUid = function(pluginUid) {
        this.pluginUid = pluginUid;
        return this;
    };

    /**
     * Retrieves the identifier of the plugin to be uninstalled
     * @method getPluginUid
     * @return {String} The plugin UID
     */
    PluginJobRunner.prototype.getPluginUid = function() {
        return this.pluginUid;
    };

    PluginJobRunner.prototype.setSite = function(site) {
        this.site = site;
        this.pluginService = new pb.PluginService({site: site});
        return this;
    };

    PluginJobRunner.prototype.getSite = function() {
        return this.site;
    };

    /**
     * Called when the tasks have completed execution and isInitiator = FALSE.  The
     * function ispects the results of each processes' execution and attempts to
     * decipher if an error occurred.  The function calls back with a result object
     * that provides four properties: success (Boolean), id (String), pluginUid
     * (String), results (Array of raw results).
     * @method processClusterResults
     * @param {Error} err The error that occurred (if any) during task execution
     * @param {Array} results An array containing the result of each executed task
     * @param {Function} cb A callback that provides two parameters: The first is
     * any error that occurred (if exists) and the second is an object that encloses
     * the properties that describe the job as well as the raw results.
     */
    PluginJobRunner.prototype.processClusterResults = function(err, results, cb) {
        if (util.isError(err)) {
            this.log(err.stack);
            cb(err, results);
            return;
        }

        var firstErr = undefined;
        var success  = true;
        for (var i = 0; i < results.length; i++) {
            if (!results[i]) {
                firstErr = util.format('An error occurred while attempting to execute the job for plugin [%s]. RESULT=[%s] TASK=[%d]', this.getPluginUid(), util.inspect(results[i]), i);
                success = false;
                break;
            }
        }

        //log any errors
        if (firstErr) {
            this.log(firstErr);
        }

        //callback with result
        var result = {
            success: success,
            id: this.getId(),
            pluginUid: this.getPluginUid(),
            error: firstErr,
            results: results
        };
        cb(err, result);
    };

    //exports
    return PluginJobRunner;
};
