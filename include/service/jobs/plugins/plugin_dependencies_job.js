/*
    Copyright (C) 2014  PencilBlue, LLC

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
var PluginJobRunner = require('./plugin_job_runner.js');

/**
 * A system job that coordinates the installation of a plugin's dependencies to
 * the plugin's node modules directory.
 * @class PluginDependenciesJob
 * @constructor
 * @extends PluginJobRunner
 */
function PluginDependenciesJob(){
    PluginDependenciesJob.super_.call(this);

    //initialize
    this.setParallelLimit(1);
};

//inheritance
util.inherits(PluginDependenciesJob, PluginJobRunner);

/**
 * Retrieves the tasks needed to contact each process in the cluster to
 * uninstall the plugin.
 * @method getInitiatorTasks
 * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
 */
PluginDependenciesJob.prototype.getInitiatorTasks = function(cb) {
    var self = this;

    //progress function
    progress  = function(indexOfExecutingTask, totalTasks) {

        var increment = indexOfExecutingTask > 0 ? 100 / totalTasks * self.getChunkOfWorkPercentage(): 0;
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
        this.createCommandTask('install_plugin_dependencies', dependenciesCommand),
    ];
    cb(null, tasks);
};

/**
 * Retrieves the tasks needed to validate that the plugin is available for
 * install.
 * @method getWorkerTasks
 * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
 */
PluginDependenciesJob.prototype.getWorkerTasks = function(cb) {
    var self = this;

    var dependencies   = null;
    var pluginUid = this.getPluginUid();
    var tasks = [

        //verify plugin is available
        function(callback) {
            var filePath = pb.PluginService.getDetailsPath(pluginUid);

            self.log("Loading plugin details to extract dependencies from: %s", filePath);
            pb.PluginService.loadDetailsFile(filePath, function(err, details) {
                var didLoad = pb.utils.isObject(details);
                if (didLoad) {
                    dependencies = details.dependencies;
                }
                callback(err, didLoad);
            });
        },

        //load dependencies
        function(callback) {
            if (!dependencies) {
                self.log('No dependencies to load.');
                callback(null, true);
                return;
            }

            pb.plugins.installPluginDependencies(pluginUid, dependencies, function(err, results) {
                callback(err, !util.isError(err));
            });
        }
    ];
    cb(null, tasks);
};

//exports
module.exports = PluginDependenciesJob;
