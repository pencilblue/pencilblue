/*
    Copyright (C) 2015  PencilBlue, LLC

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
var util = require('../../../util.js');

module.exports = function PluginAvailableJobModule(pb) {

    /**
     * A system job that coordinates the check to see if a plugin is available for
     * install on each process across the cluster.
     * @class PluginAvailableJob
     * @constructor
     * @extends PluginJobRunner
     */
    function PluginAvailableJob(){
        PluginAvailableJob.super_.call(this);

        //initialize
        this.setParallelLimit(1);
    }
    util.inherits(PluginAvailableJob, pb.PluginJobRunner);

    /**
     * Retrieves the tasks needed to contact each process in the cluster to
     * uninstall the plugin.
     * @method getInitiatorTasks
     * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
     */
    PluginAvailableJob.prototype.getInitiatorTasks = function(cb) {
        var self = this;

        //progress function
        var progress  = function(indexOfExecutingTask, totalTasks) {

            var increment = indexOfExecutingTask > 0 ? 100 / totalTasks * self.getChunkOfWorkPercentage(): 0;
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
    };

    /**
     * Retrieves the tasks needed to validate that the plugin is available for
     * install.
     * @method getWorkerTasks
     * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
     */
    PluginAvailableJob.prototype.getWorkerTasks = function(cb) {
        var self = this;

        var pluginUid = this.getPluginUid();
        var tasks = [

            //verify plugin is available
            function(callback) {
                var filePath = pb.PluginService.getDetailsPath(pluginUid);

                self.log("Inspecting plugin on disk at: %s", filePath);
                pb.PluginService.loadDetailsFile(filePath, callback);
            }
        ];
        cb(null, tasks);
    };

    //exports
    return PluginAvailableJob;
};
