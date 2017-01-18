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
var PluginJobRunner = require('./plugin_job_runner');
var PluginService = require('../../entities/plugin_service');

/**
 * A system job that coordinates the check to see if a plugin is available for
 * install on each process across the cluster.
 * @class PluginAvailableJob
 * @constructor
 * @extends PluginJobRunner
 */
class PluginAvailableJob extends PluginJobRunner {
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
        var validateCommand = {
            jobId: this.getId(),
            pluginUid: this.getPluginUid(),
            progress: progress
        };

        //build out the tasks to execute
        var tasks = [

            //validate available for all
            this.createCommandTask('is_plugin_available', validateCommand),
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

        var pluginUid = this.getPluginUid();
        var tasks = [

            //verify plugin is available
            function (callback) {
                var filePath = PluginService.getDetailsPath(pluginUid);

                self.log("Inspecting plugin on disk at: %s", filePath);
                PluginService.loadDetailsFile(filePath, callback);
            }
        ];
        cb(null, tasks);
    }
}

//exports
module.exports = PluginAvailableJob;
