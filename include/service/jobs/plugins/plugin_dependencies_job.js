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
const CommandService = require('../../../system/command/command_service');
const log = require('../../../utils/logging').newInstance('PluginDependenciesJob');
const NpmPluginDependencyService = require('../../entities/plugins/npm_plugin_dependency_service');
const PluginDetailsLoader = require('../../entities/plugins/loaders/pluginDetailsLoader');
const PluginJobRunner = require('./plugin_job_runner');
const PluginService = require('../../entities/plugin_service');
const SiteUtils = require('../../../../lib/utils/siteUtils');
const util = require('util');

/**
 * A system job that coordinates the installation of a plugin's dependencies to
 * the plugin's node modules directory.
 * @class PluginDependenciesJob
 * @constructor
 * @extends PluginJobRunner
 */
class PluginDependenciesJob extends PluginJobRunner {
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
        return 'install_plugin_dependencies';
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
                callback(null, didLoad);
            },

            //load dependencies
            function (callback) {
                if (!_.isObject(pluginDetails) || !_.isObject(pluginDetails.dependencies)) {
                    self.log('No dependencies to load.');
                    return callback(null, true);
                }

                var npmDependencyService = new NpmPluginDependencyService();
                npmDependencyService.installAll(pluginDetails, {}, function (err/*, results*/) {
                    callback(err, !_.isError(err));
                });
            }
        ];
        cb(null, tasks);
    }

    /**
     * <b>NOTE: DO NOT CALL THIS DIRECTLY</b><br/>
     * The function is called when a command is recevied to install plugin
     * dependencies.  The result is then sent back to the calling process via the
     * CommandService.
     * @param {Object} command
     * @param {String} command.jobId The ID of the in-progress job that this
     * process is intended to join.
     */
    static onCommandReceived(command) {
        if (!_.isObject(command)) {
            log.error('PluginService: an invalid install_plugin_dependencies command object was passed. %s', util.inspect(command));
            return;
        }

        var name = util.format("INSTALL_DEPENDENCIES_%s", command.pluginUid);
        var ctx = {
            id: command.jobId,
            name: name,
            pluginUid: command.pluginUid,
            pluginService: new PluginService({site: SiteUtils.GLOBAL_SITE}),
            initiator: false
        };
        var job = new PluginDependenciesJob(ctx);
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
     */
    static registerCommandCallbacks () {

        //register for commands
        var commandService = CommandService.getInstance();
        return commandService.registerForType(PluginDependenciesJob.PLUGIN_COMMAND, PluginDependenciesJob.onCommandReceived);
    }
}

//exports
module.exports = PluginDependenciesJob;
