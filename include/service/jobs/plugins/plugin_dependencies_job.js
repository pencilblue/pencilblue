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
var _ = require('lodash');
var PluginJobRunner = require('./plugin_job_runner');
var PluginDetailsLoader = require('../../entities/plugins/loaders/pluginDetailsLoader');

/**
 * A system job that coordinates the installation of a plugin's dependencies to
 * the plugin's node modules directory.
 * @class PluginDependenciesJob
 * @constructor
 * @extends PluginJobRunner
 */
class PluginDependenciesJob extends PluginJobRunner {
    constructor() {
        super();

        //initialize
        this.setParallelLimit(1);
    }

    /**
     * Retrieves the tasks needed to contact each process in the cluster to
     * uninstall the plugin.
     * @method getInitiatorTasks
     * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
     */
    getInitiatorTasks(cb) {
        var self = this;

        //progress function
        var progress = function (indexOfExecutingTask, totalTasks) {

            var increment = indexOfExecutingTask > 0 ? 100 / totalTasks * self.getChunkOfWorkPercentage() : 0;
            self.onUpdate(increment);
        };

        //build out validate command
        var dependenciesCommand = {
            jobId: this.getId(),
            pluginUid: this.getPluginUid(),
            progress: progress,
            timeout: 120000
        };

        //build out the tasks to execute
        var tasks = [

            //install dependencies for all
            this.createCommandTask('install_plugin_dependencies', dependenciesCommand)
        ];
        cb(null, tasks);
    }

    /**
     * Retrieves the tasks needed to validate that the plugin is available for
     * install.
     * @method getWorkerTasks
     * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
     */
    getWorkerTasks(cb) {
        var self = this;

        var pluginDetails = null;
        var pluginUid = this.getPluginUid();
        var tasks = [

            //verify plugin is available
            function (callback) {

                self.log("Loading plugin details for: %s", pluginUid);
                var details = PluginDetailsLoader.load(pluginUid);
                var didLoad = _.isObject(details);
                if (didLoad) {
                    pluginDetails = details;
                }
                callback(err, didLoad);
            },

            //load dependencies
            function (callback) {
                if (!_.isObject(pluginDetails) || !_.isObject(pluginDetails.dependencies)) {
                    self.log('No dependencies to load.');
                    return callback(null, true);
                }

                self.pluginService.installPluginDependencies(pluginUid, pluginDetails.dependencies, pluginDetails, function (err/*, results*/) {
                    callback(err, !_.isError(err));
                });
            }
        ];
        cb(null, tasks);
    }
}

//exports
module.exports = PluginDependenciesJob;
