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

module.exports = function PluginInitializeJobModule(pb) {

    /**
     * A system job that coordinates the initialization of a plugin across a
     * cluster
     * @class PluginInitializeJob
     * @constructor
     * @extends PluginJobRunner
     */
    function PluginInitializeJob(){
        PluginInitializeJob.super_.call(this);

        //initialize
        this.setParallelLimit(1);
    }
    util.inherits(PluginInitializeJob, pb.PluginJobRunner);

    /**
     * Retrieves the tasks needed to contact each process in the cluster to
     * initialize the plugin.
     * @method getInitiatorTasks
     * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
     */
    PluginInitializeJob.prototype.getInitiatorTasks = function(cb) {
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
            site: this.getSite(),
            progress: progress,
            timeout: 20000
        };

        //build out the tasks to execute
        var tasks = [

            //validate available for all
            this.createCommandTask('initialize_plugin', validateCommand),
        ];
        cb(null, tasks);
    };

    /**
     * Retrieves the tasks needed to initialize the plugin for this process.
     * @method getWorkerTasks
     * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
     */
    PluginInitializeJob.prototype.getWorkerTasks = function(cb) {
        var self = this;

        var pluginUid = this.getPluginUid();
        var site = this.getSite();
        var tasks = [

            //initialize the plugin if not already
            function(callback) {
                if (pb.PluginService.isPluginActiveBySite(pluginUid, site)) {
                    self.log('Plugin %s is already active!', pluginUid);
                    callback(null, true);
                    return;
                }

                //load the plugin from persistence then initialize it on the server
                self.pluginService.getPluginBySite(pluginUid, function(err, plugin) {
                    if (util.isError(err)) {
                        callback(err);
                        return;
                    }
                    else if (!util.isObject(plugin)) {
                        self.log('Could not find plugin descriptor %s', pluginUid);
                        callback(new Error('Failed to load the plugin '+pluginUid));
                        return;
                    }

                    self.log('Initializing plugin %s', pluginUid);
                    self.pluginService.initPlugin(plugin, function(err, result) {
                        self.log('Completed initialization RESULT=[%s] ERROR=[%s]', result, err ? err.message : 'n/a');
                        callback(err, result);
                    });
                });
            }
        ];
        cb(null, tasks);
    };

    //exports
    return PluginInitializeJob;
};
