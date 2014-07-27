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
 * A system job that coordinates the uninstall of a plugin across the cluster.
 * The job has two modes.  The first is initiator.  This is the process that
 * receives the request to uninstall the plugin.  It coordinates a sequenced
 * uninstall from each process in the cluster.  The initiator does this by
 * getting a list of active processes through the service registry.  It then
 * uses the registry to send a message to each process to uninstall the plugin.
 * Some operations are repeated for each server but this is ok based on the
 * current set of operations.  When a command is received that instructs a
 * process to uninstall a plugin it creates an instance of the plugin uninstall
 * job with isInitiator = FALSE.  This changes causes the actual uninstall
 * process to take place.  Log statements are sent both to the system logger
 * and to the job log persistence entity.
 * @class PluginInstallJob
 * @constructor
 * @extends PluginJobRunner
 */
function PluginInstallJob(){
    PluginJobRunner.constructor.apply(this, []);

    //initialize
    this.init();
    this.setParallelLimit(1);
};

//inheritance
util.inherits(PluginInstallJob, PluginJobRunner);

/**
 * Retrieves the tasks needed to contact each process in the cluster to
 * uninstall the plugin.
 * @method getInitiatorTasks
 * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
 */
PluginInstallJob.prototype.getInitiatorTasks = function(cb) {
    var self = this;

    //progress function
    var tasks = [

        //validate available for all
        function(callback) {

            var name = util.format("IS_AVAILABLE_%s", command.pluginUid);
            var job  = new pb.PluginAvailableJob();
            job.setIsInitiator(false)
            .init(name, self.getJobId())
            .setPuginUid(self.getPluginUid())
            .setChunkOfWorkPercentage(1/3)
            .run(callback);
        },

        //install dependencies across cluster
        function(callback) {

            var name = util.format("INSTALL_DEPENDENCIES_%s", command.pluginUid);
            var job  = new pb.PluginDependenciesJob();
            job.setIsInitiator(false)
            .init(name, self.getJobId())
            .setPuginUid(self.getPluginUid())
            .setChunkOfWorkPercentage(1/3)
            .run(callback);
        },

        //do persistence tasks
        function(callback) {
            self.doPersistenceTasks(function(err, results) {
                self.onUpdate(100 / tasks.length);
                callback(err, results);
            });
        },

        //initialize plugin across cluster
        function(callback) {

            var name = util.format("INITIALIZE_PLUGIN_%s", command.pluginUid);
            var job  = new pb.PluginInitializeJob();
            job.setIsInitiator(false)
            .init(name, self.getJobId())
            .setPuginUid(self.getPluginUid())
            .setChunkOfWorkPercentage(1/3)
            .run(callback);
        }
    ];
    cb(null, tasks);
};

/**
 * Retrieves 0 tasks because the PluginInstallJob is a coordinator job.  It is
 * a combination of smaller jobs that execute across the cluster.
 * @method getWorkerTasks
 * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
 */
PluginInstallJob.prototype.getWorkerTasks = function(cb) {
    throw new Error('The PluginInstallJob should only be initialized in Initiator mode!');
};

/**
 *
 * @method doPersistenceTasks
 */
PluginInstallJob.prototype.doPersistenceTasks = function(cb) {

};

//exports
module.exports = PluginInstallJob;
