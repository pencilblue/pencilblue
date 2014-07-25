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
var AsyncJobRunner = require('../async_job_runner.js');

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
 * @class PluginUninstallJob
 * @constructor
 * @extends AsyncJobRunner
 */
function PluginUninstallJob(){
    this.init();
    this.setParallelLimit(1);
};

//inheritance
util.inherits(PluginUninstallJob, AsyncJobRunner);

//statics
/**
 * The command to that intends for the the uninstall job to run
 * @static
 * @property UNINSTALL_PLUGIN_COMMAND
 * @type {String}
 */
PluginUninstallJob.UNINSTALL_PLUGIN_COMMAND = 'uninstall_plugin';

/**
 * Indicates if the job is to run as the initiator or a worker.  When TRUE, the
 * job sends commands to all processes in the cluster to perform the
 * uninstallation of the plugin.  When FALSE, the actual uninstall is performed.
 * @property isInitiator
 * @type {Boolean}
 */
PluginUninstallJob.prototype.isInitiator = true;

/**
 * The unique identifier of the plugin to be uninstalled
 * @property pluginUid
 * @type {String}
 */
PluginUninstallJob.prototype.pluginUid = '';

/**
 * Indicates if the job is to run as the initiator or a worker.  When TRUE, the
 * job sends commands to all processes in the cluster to perform the
 * uninstallation of the plugin.  When FALSE, the actual uninstall is performed.
 * @method setRunAsInitiator
 * @param {Boolean} isInitiator
 * @return {PluginUninstallJob} This instance
 */
PluginUninstallJob.prototype.setRunAsInitiator = function(isInitiator) {
    this.isInitiator = isInitiator ? true : false;
    return this;
};

/**
 * Sets the unique plugin identifier for the plugin to be uninstalled
 * @method setPluginUid
 * @param {String} The plugin identifier
 * @return {PluginUninstallJob} This instance
 */
PluginUninstallJob.prototype.setPluginUid = function(pluginUid) {
    this.pluginUid = pluginUid;
    return this;
};

/**
 * Retrieves the identifier of the plugin to be uninstalled
 * @method getPluginUid
 * @return {String} The plugin UID
 */
PluginUninstallJob.prototype.getPluginUid = function() {
    return this.pluginUid;
};

/**
 * Retrieves the tasks to be executed by this job.  The tasks provided to the
 * callback are determined by the isInitiator property.
 * @see AsyncJobRunner#getTasks
 * @method getTasks
 * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
 */
PluginUninstallJob.prototype.getTasks = function(cb) {
    if (this.isInitiator) {
        this.getInitiatorTasks(cb);
    }
    else {
        this.getWorkerTasks(cb);
    }
}

/**
 * Retrieves the tasks needed to contact each process in the cluster to
 * uninstall the plugin.
 * @method getInitiatorTasks
 * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
 */
PluginUninstallJob.prototype.getInitiatorTasks = function(cb) {
    var self = this;

    var tasks = [

        //uninstall command to all in cluster
        function(callback) {

            var command = {
                pluginUid: self.getPluginUid(),
                jobId: self.getId(),

                //we provide a progress function to update the job listing
                progress: function(indexOfExecutingTask, totalTasks) {

                    var increment = indexOfExecutingTask > 0 ? 100 / totalTasks : 0;
                    self.onUpdate(increment);
                }
            };
            pb.CommandService.sendCommandToAllGetResponses(PluginUninstallJob.UNINSTALL_PLUGIN_COMMAND, command, function(err, results) {
                if (util.isError(err)) {
                    callback(err);
                    return;
                }

                //check for success or failure
                for (var i = 0; i < results.length; i++) {

                    if (results[i].error) {
                        callback(new Error('A failure occurred while performing the install on at least one of the processes.  Check the job log for more details.'));
                        return;
                    }
                }
                callback(null, true);
            });
        }
    ];
    cb(null, tasks);
};

/**
 * Retrieves the tasks needed to uninstall the plugin from this executing
 * process.  The tasks are executed in series:
 * <ol>
 * <li>Call the plugin's onUninstall function</li>
 * <li>Unregister any routes and controllers</li>
 * <li>Remove any plugin settings</li>
 * <li>Remove any theme settings</li>
 * <li>Remove the plugin record from persistence</li>
 * <li>Switch active theme if needed</li>
 * <li>Deactivate the plugin from this process</li>
 * </ol>
 * @method getWorkerTasks
 * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
 */
PluginUninstallJob.prototype.getWorkerTasks = function(cb) {
    var self = this;

    var pluginUid = this.getPluginUid();
    var tasks = [

        //call onUninstall
        function(callback) {
            if (!pb.PluginService.isActivePlugin(pluginUid)) {
                self.log("Skipping call to plugin's onUninstall function.  Main module was not active.");
                callback(null, true);
                return;
            }

            var mm = pb.PluginService.getActiveMainModule(pluginUid);
            if (pb.utils.isFunction(mm.onUninstall)) {
                self.log('Calling plugin onUnstall', pluginUid);

                var d = domain.create();
                d.on('error', callback);
                d.run(function() {
                    mm.onUninstall(callback);
                });
            }
            else {
                self.log('Plugin onUninstall function does not exist.  Skipping.');
                callback(null, true);
            }
        },

        //unregister routes
        function(callback) {
            var routesRemoved = pb.RequestHandler.unregisterThemeRoutes(pluginUid);
            self.log('Unregistered %d routes', routesRemoved);
            process.nextTick(function(){callback(null, true);});
        },

        //remove localization
        function(callback) {
            //TODO refactor localization to figure out how to remove only those
            //that were overriden. For now any overriden localizations will be
            //left until the server cycles.  This is not ideal but will suffice
            //for most use cases.  The only affected use case is if a default
            //label is overriden.
            process.nextTick(function(){callback(null, true);});
        },

        //remove settings
        function(callback) {
            self.log('Attemping to remove plugin settings');

            pb.plugins.pluginSettingsService.purge(pluginUid, function (err, result) {
                callback(err, !util.isError(err) && result);
            });
        },

        //remove theme settings
        function(callback) {
            self.log('Attemping to remove theme settings');

            pb.plugins.themeSettingsService.purge(pluginUid, function (err, result) {
                callback(err, !util.isError(err) && result);
            });
        },

        //remove plugin record from "plugin" collection
        function(callback) {
            self.log('Attemping to remove plugin from persistent storage');

            var where = {
                uid: pluginUid
            };
            var dao = new pb.DAO();
            dao.deleteMatching(where, 'plugin').then(function(result) {

                var error = util.isError(result) ? result : null;
                callback(error, error == null);
            });
        },

        //roll over to default theme
        function(callback) {
            self.log('Inspecting the active theme');

            //retrieve the plugin so we can see if the value matches what we
            //are uninstalling
            pb.settings.get('active_theme', function(err, activeTheme) {
                if (util.isError(err)) {
                    callback(err, false);
                    return;
                }

                //check if we need to reset the active theme
                if (activeTheme === pluginUid) {
                    self.log('Uninstalling the active theme.  Switching to pencilblue');

                    pb.settings.set('active_theme', 'pencilblue', function(err, result) {
                        callback(err, result ? true : false);
                    });
                }
                else {
                    callback(null, true);
                }
            });
        },

        //remove from ACTIVE_PLUGINS//unregister services
        function(callback) {
            var result = pb.PluginService.deactivatePlugin(pluginUid);
            process.nextTick(function(){callback(null, result);});
        }
    ];
    cb(null, tasks);
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
PluginUninstallJob.prototype.processResults = function(err, results, cb) {
    if (util.isError(err)) {
        cb(err, results);
        return;
    }

    //create function to handle cleanup and cb
    var self = this;
    var finishUp = function(err, result) {

        //only set done if we were the process that organized this uninstall.
        if (self.isInitiator) {
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
PluginUninstallJob.prototype.processClusterResults = function(err, results, cb) {
    if (util.isError(err)) {
        cb(err, results);
        return;
    }

    var firstErr = undefined;
    var success  = true;

    outside:
    for (var i = 0; i < results.length; i++) {
        if (!results[i]) {
            firstErr = 'An error occurred while attempting to uninstall ['+this.getPluginUid()+']';
            success = false;
            break;
        }
    }

    var result = {
        success: success,
        id: this.getId(),
        pluginUid: this.getPluginUid(),
        results: results
    };
    cb(err, result);
};

/**
 * Called when the tasks have completed execution and isInitiator = FALSE. The
 * function blindly passes the results of the tasks back to the callback.
 * @param {Error} err The error that occurred (if any) during task execution
 * @param {Array} results An array containing the result of each executed task
 * @param {Function} cb A callback that provides two parameters: The first is
 * any error that occurred (if exists) and the second is an array of Boolean
 * values that indicate the success or failure of each task.
 */
PluginUninstallJob.prototype.processWorkerResults = function(err, results, cb) {
    cb(err, results);
};

/**
 * Called before the start of task execution.  When the property isInitiator =
 * TRUE the onStart function is called to mark the start of the job.  It is not
 * called for others because it is assumed that workers are already part of an
 * in-progress cluster uninstall and that an existing job id has been provided.
 * @method onBeforeFirstTask
 * @param {Function} cb A callback that takes two parameters. The first is an
 * Error (if occurred) and the second is a boolean value that indicates if the
 * function successfully completed any pre-requsite operations before task
 * execution begins.
 */
PluginUninstallJob.prototype.onBeforeFirstTask = function(cb) {
    if (this.isInitiator) {
        this.onStart();
    }
    cb(null, true);
};

//exports
module.exports = PluginUninstallJob;
