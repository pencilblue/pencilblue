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
var async = require('async');
var util  = require('../../../util.js');
const Promise = require('bluebird');

module.exports = function PluginInstallJobModule(pb) {
    var GLOBAL_SITE = pb.SiteService.GLOBAL_SITE;

    /**
     * A system job that coordinates the install of a plugin across the cluster.
     * The job has two modes.  The first is initiator.  This is the process that
     * receives the request to uninstall the plugin.  It coordinates a sequenced
     * install from each process in the cluster.  The initiator does this by
     * getting a list of active processes through the service registry.  It then
     * uses the registry to send a message to each process to uninstall the plugin.
     * Some operations are repeated for each server but this is ok based on the
     * current set of operations.  When a command is received that instructs a
     * process to install a plugin it creates an instance of the plugin install
     * job with isInitiator = FALSE.  This changes causes the actual install
     * process to take place.  Log statements are sent both to the system logger
     * and to the job log persistence entity.
     * @class PluginInstallJob
     * @constructor
     * @extends PluginJobRunner
     */
    function PluginInstallJob(options){
        options = options || {};

        this.site = options.site || pb.SiteService.GLOBAL_SITE;

        PluginInstallJob.super_.call(this);

       this.pluginService = new pb.PluginService(this.site);
        //initialize
        this.init();
        this.setParallelLimit(1);
    }
    util.inherits(PluginInstallJob, pb.PluginJobRunner);

    /**
     * Retrieves the tasks needed to contact each process in the cluster to
     * uninstall the plugin.
     * @method getInitiatorTasks
     * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
     */
    PluginInstallJob.prototype.getInitiatorTasks = function(cb) {
        var self = this;

        //progress function
        var jobId     = self.getId();
        var pluginUid = self.getPluginUid();
        var site      = self.getSite();
        var tasks = [

            //verify that the plugin is not already installed
            function(callback) {
                self.log("Verifying that plugin %s is not already installed", pluginUid);

                self.pluginService.isInstalled(pluginUid, function(err, isInstalled){
                    if (util.isError(err)) {
                        callback(err, !isInstalled);
                    }
                    else {
                        err = isInstalled ? (new Error('The '+pluginUid+' plugin is already installed')) : null;
                        callback(err, !isInstalled);
                    }
                });
            },

            //validate available for all
            function(callback) {

                var name = util.format("IS_AVAILABLE_%s", pluginUid);
                var job  = new pb.PluginAvailableJob();
                job.setRunAsInitiator(true)
                .init(name, jobId)
                .setPluginUid(pluginUid)
                .setSite(site)
                .setChunkOfWorkPercentage(1/2)
                .run(callback);
            },

            //do persistence tasks
            function(callback) {
                self.doPersistenceTasks(function(err, results) {
                    self.onUpdate(100 / tasks.length);
                    if (util.isError(err)) {
                        self.log(err.stack);
                    }
                    callback(err, results);
                });
            },

            //initialize plugin across cluster
            function(callback) {

                var name = util.format("INITIALIZE_PLUGIN_%s", pluginUid);
                var job  = new pb.PluginInitializeJob();
                job.setRunAsInitiator(true)
                .init(name, jobId)
                .setPluginUid(pluginUid)
                .setSite(site)
                .setChunkOfWorkPercentage(1/2)
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
        let persistenceService = new pb.PluginPersistenceService(this.log.bind(this));
        Promise.resolve(persistenceService.persist(this.getPluginUid(), null, this.getSite()))
            .asCallback(cb);
    };

    //exports
    return PluginInstallJob;
};
