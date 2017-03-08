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
const async = require('async');
const DAO = require('../../../dao/dao');
const SiteJobRunner = require('./site_job_runner');

/**
 * Job to deactivate a site.
 * @class SiteDeactivateJob
 * @constructor SiteDeactivateJob
 * @extends SiteJobRunner
 */
class SiteDeactivateJob extends SiteJobRunner {
    constructor() {
        super();

        //initialize
        this.init();
        this.setParallelLimit(1);
    }

    /**
     * Get tasks to deactivate a site.
     * @method getInitiatorTasks
     * @override
     * @param {Function} cb - callback function
     */
    getInitiatorTasks(cb) {
        var self = this;

        var jobId = self.getId();
        var site = self.getSite();
        var deactivateCommand = {
            jobId: jobId,
            site: site
        };

        //progress function
        var tasks = [
            //deactivate site in mongo
            function (callback) {
                self.doPersistenceTasks(function (err, results) {
                    self.onUpdate(100 / tasks.length);
                    if (_.isError(err)) {
                        self.log(err.stack);
                    }
                    callback(err, results);
                });
            },

            //remove site to request handler site collection across cluster
            self.createCommandTask('deactivate_site', deactivateCommand)
        ];
        cb(null, tasks);
    }

    /**
     * Get task to stop accepting traffic for the site.
     * @method getWorkerTasks
     * @override
     * @param {Function} cb - callback
     */
    getWorkerTasks(cb) {
        var self = this;

        var site = this.getSite();
        var tasks = [

            //allow traffic to start routing for site
            function (callback) {
                self.siteService.stopAcceptingSiteTraffic(site.uid, callback);
            }
        ];
        cb(null, tasks);
    }

    /**
     * Update site to active as false in database to deactivate.
     * @method doPersistenceTasks
     * @param {Function} cb - callback
     */
    doPersistenceTasks(cb) {

        var site = this.getSite();
        var tasks = [
            //set site to active in mongo
            function (callback) {
                var dao = new DAO();
                dao.loadByValue('uid', site.uid, 'site', function (err, site) {
                    if (_.isError(err)) {
                        return callback(err, null);
                    }

                    if (!site) {
                        return callback(new Error('Site not found'), null);
                    }

                    site.active = false;
                    dao.save(site, function (err, result) {
                        if (_.isError(err)) {
                            return cb(err, null);
                        }

                        ActiveSiteService.deactivate(site.uid);
                        callback(err, result);
                    });
                });
            }
        ];
        async.series(tasks, function (err/*, results*/) {
            cb(err, !_.isError(err));
        });
    }
}

//exports
module.exports = SiteDeactivateJob;
