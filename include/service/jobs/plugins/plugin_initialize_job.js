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
const _ = require('lodash');
const ActivePluginService = require('../../../../lib/service/plugins/activePluginService');
const CommandService = require('../../../system/command/command_service');
const log = require('../../../utils/logging').newInstance('PluginInitializeJob');
const PluginJobRunner = require('./plugin_job_runner');
const PluginService = require('../../entities/plugin_service');
const util = require('util');

/**
 * A system job that coordinates the initialization of a plugin across a
 * cluster
 * @class PluginInitializeJob
 * @constructor
 * @extends PluginJobRunner
 */
class PluginInitializeJob extends PluginJobRunner {
    constructor(context) {
        super(context);

        //initialize
        this.setParallelLimit(1);
    }

    /**
     * The command to that intends for the the uninstall job to run
     * @readonly
     * @type {String}
     */
    static get PLUGIN_COMMAND() {
        return 'initialize_plugin';
    }

    /**
     * Retrieves the tasks needed to contact each process in the cluster to
     * initialize the plugin.
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
    }

    /**
     * Retrieves the tasks needed to initialize the plugin for this process.
     * @method getWorkerTasks
     * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
     */
    getWorkerTasks(cb) {
        var self = this;

        var pluginUid = this.getPluginUid();
        var site = this.getSite();
        var tasks = [

            //initialize the plugin if not already
            function (callback) {
                if (ActivePluginService.isActiveForSite(pluginUid, site)) {
                    self.log('Plugin %s is already active!', pluginUid);
                    callback(null, true);
                    return;
                }

                //load the plugin from persistence then initialize it on the server
                self.pluginService.getPluginBySite(pluginUid, function (err, plugin) {
                    if (_.isError(err)) {
                        callback(err);
                        return;
                    }
                    else if (!_.isObject(plugin)) {
                        self.log('Could not find plugin descriptor %s', pluginUid);
                        callback(new Error('Failed to load the plugin ' + pluginUid));
                        return;
                    }

                    self.log('Initializing plugin %s', pluginUid);
                    self.pluginService.initPlugin(plugin, function (err, result) {
                        self.log('Completed initialization RESULT=[%s] ERROR=[%s]', result, err ? err.message : 'n/a');
                        callback(err, result);
                    });
                });
            }
        ];
        cb(null, tasks);
    }

    /**
     * <b>NOTE: DO NOT CALL THIS DIRECTLY</b><br/>
     * The function is called when a command is recevied to initialize a plugin.
     * The result is then sent back to the calling process via the
     * CommandService.
     * @param {Object} command
     * @param {String} command.jobId The ID of the in-progress job that this
     * process is intended to join.
     */
    static onCommandReceived(command) {
        if (!_.isObject(command)) {
            log.error('PluginService: an invalid initialize_plugin command object was passed. %s', util.inspect(command));
            return;
        }

        var name = util.format("INITIALIZE_PLUGIN_%s", command.pluginUid);
        var ctx = {
            id: command.id,
            name: name,
            pluginUid: command.pluginUid,
            pluginService: new PluginService({site: command.site}),
            initiator: false
        };
        var job = new PluginInitializeJob(ctx);
        job.setRunAsInitiator(false)
            .init(name, command.jobId)
            .run(function (err, result) {

                var response = {
                    error: err ? err.stack : undefined,
                    result: result ? true : false
                };
                CommandService.getInstance().sendInResponseTo(command, response);
            });
    }

    /**
     *
     * @returns {Boolean}
     */
    static registerCommandCallbacks () {

        //register for commands
        var commandService = CommandService.getInstance();
        return commandService.registerForType(PluginInitializeJob.PLUGIN_COMMAND, PluginInitializeJob.onCommandReceived);
    }
}

//exports
module.exports = PluginInitializeJob;
