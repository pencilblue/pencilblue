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
var util = require('../../util.js');

module.exports = function ClusterJobRunnerModule(pb) {

    /**
     * Abstract prototype used to run a job against an entire cluster by running in
     * one of two modes:  initiator and worker.
     * @class ClusterJobRunner
     * @constructor
     * @extends AsyncJobRunner
     */
    function ClusterJobRunner(){
        ClusterJobRunner.super_.call(this);
    }
    util.inherits(ClusterJobRunner, pb.AsyncJobRunner);

    /**
     * Indicates if the job is to run as the initiator or a worker.  When TRUE, the
     * job sends commands to all processes in the cluster to perform the
     * job.  When FALSE, the actual job is performed.
     * @property isInitiator
     * @type {Boolean}
     */
    ClusterJobRunner.prototype.isInitiator = true;

    /**
     * Indicates if the job is to run as the initiator or a worker.  When TRUE, the
     * job sends commands to all processes in the cluster to perform the
     * job.  When FALSE, the actual job is performed on this process.
     * @method setRunAsInitiator
     * @param {Boolean} isInitiator
     * @return {ClusterJobRunner} This instance
     */
    ClusterJobRunner.prototype.setRunAsInitiator = function(isInitiator) {
        this.isInitiator = isInitiator ? true : false;
        return this;
    };

    /**
     * Retrieves the tasks to be executed by this job.  The tasks provided to the
     * callback are determined by the isInitiator property.
     * @see AsyncJobRunner#getTasks
     * @method getTasks
     * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
     */
    ClusterJobRunner.prototype.getTasks = function(cb) {
        if (this.isInitiator) {
            this.getInitiatorTasks(cb);
        }
        else {
            this.getWorkerTasks(cb);
        }
    };

    /**
     * Retrieves the tasks needed to contact each process in the cluster to
     * perform the job.
     * @method getInitiatorTasks
     * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
     */
    ClusterJobRunner.prototype.getInitiatorTasks = function(cb) {
        throw new Error('ClusterJobRunner.getInitiatorTasks must be overriden by the extending implementation');
    };

    /**
     * Retrieves the tasks needed to perform the job on this process.
     * @method getWorkerTasks
     * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
     */
    ClusterJobRunner.prototype.getWorkerTasks = function(cb) {
        throw new Error('ClusterJobRunner.getWorkerTasks must be overriden by the extending implementation');
    };

    /**
     * Called when the job has completed its assigned set of tasks.  The function
     * is responsible for processing the results and calling back with the refined
     * result.
     * @see AsyncJobRunner#processResults
     * @method processResults
     * @param {Error} err The error that occurred (if any) during task execution
     * @param {Array} results An array containing the result of each executed task
     * @param {Function} cb A callback that provides two parameters: The first is
     * any error that occurred (if exists) and the second is dependent on the
     * isInitiator property.  See processClusterResults and processWorkerResults
     * for more details.
     */
    ClusterJobRunner.prototype.processResults = function(err, results, cb) {
        if (util.isError(err)) {
            cb(err, results);
            return;
        }

        //create function to handle cleanup and cb
        var self = this;
        var finishUp = function(err, result) {

            //only set done if we were the process that organized this job.
            //The second condition ensures we aren't a sub-job
            if (self.isInitiator && self.getChunkOfWorkPercentage() === 1) {
                self.onCompleted(err);
            }
            cb(err, result);
        };

        if (this.isInitiator) {
            this.processClusterResults(err, results, finishUp);
        }
        else {
            this.processWorkerResults(err, results, finishUp);
        }
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
    ClusterJobRunner.prototype.processClusterResults = function(err, results, cb) {
        throw new Error('ClusterJobRunner.processClusterResults must be overriden by the extending implementation');
    };

    /**
     * Called when the tasks have completed execution and isInitiator = FALSE. The
     * function blindly passes the results of the tasks back to the callback.
     * @method processWorkerResults
     * @param {Error} err The error that occurred (if any) during task execution
     * @param {Array} results An array containing the result of each executed task
     * @param {Function} cb A callback that provides two parameters: The first is
     * any error that occurred (if exists) and the second is an array of Boolean
     * values that indicate the success or failure of each task.
     */
    ClusterJobRunner.prototype.processWorkerResults = function(err, results, cb) {
        cb(err, results);
    };

    /**
     * Called before the start of task execution.  When the property isInitiator =
     * TRUE the onStart function is called to mark the start of the job.  It is not
     * called for others because it is assumed that workers are already part of an
     * in-progress cluster job and that an existing job id has been provided.
     * @method onBeforeFirstTask
     * @param {Function} cb A callback that takes two parameters. The first is an
     * Error (if occurred) and the second is a boolean value that indicates if the
     * function successfully completed any pre-requsite operations before task
     * execution begins.
     */
    ClusterJobRunner.prototype.onBeforeFirstTask = function(cb) {
        if (this.isInitiator && this.getChunkOfWorkPercentage() === 1) {
            this.onStart();
        }
        cb(null, true);
    };

    /**
     * Creates a simple task that sends a command to the entire cluster then waits
     * for all responses.  Success if determined by the lack of an Error in the
     * callback in addition to the lack of an "error" property on each item in the
     * results array provided by the cb from the call to send the command.
     * @method createCommandTask
     * @param {String} type The command type
     * @param {Object} command The command to broadcast to the cluster.
     */
    ClusterJobRunner.prototype.createCommandTask = function(type, command) {
        return function(callback) {
            pb.CommandService.getInstance().sendCommandToAllGetResponses(type, command, function(err, results) {
                if (util.isError(err)) {
                    callback(err);
                    return;
                }

                //check for success or failure
                for (var i = 0; i < results.length; i++) {

                    if (results[i].err) {
                        callback(new Error('A failure occurred while performing tasks across remote processes.  Check the job log for more details: '+results[i].err));
                        return;
                    }
                }
                callback(null, true);
            });
        }
    };

    //exports
    return ClusterJobRunner;
};
