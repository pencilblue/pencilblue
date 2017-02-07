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
var _ = require('lodash');
var async = require('async');
var DAO = require('../../../dao/dao');
var RequestHandler = require('../../../http/request_handler');
var SiteJobRunner = require('./site_job_runner');
var SiteService = require('../../entities/site_service');

/**
 * Job to create/edit a site.
 * @class SiteCreateEditJob
 * @extends SiteJobRunner
 * @constructor
 */
class SiteCreateEditJob extends SiteJobRunner {
    constructor() {
        super();

        //initialize
        this.init();
        this.setParallelLimit(1);
    }

    /**
     * Get tasks to create/edit a site.
     * @method getInitiatorTasks
     * @override
     * @param {Function} cb - callback function
     */
    getInitiatorTasks(cb) {
        var self = this;

        var jobId = self.getId();
        var site = self.getSite();

        var createEditCommand = {
            jobId: jobId,
            site: site
        };

        //progress function
        var tasks = [
            //create/edit site in mongo
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
            self.createCommandTask('create_edit_site', createEditCommand)
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
        var site = this.getSite();
        var tasks = [
            //allow traffic to start routing for site
            function (callback) {
                RequestHandler.loadSite(site);
                callback();
            }
        ];
        cb(null, tasks);
    }

    /**
     * Update site to active as false in database to create/edit.
     * @method doPersistenceTasks
     * @param {Function} cb - callback
     */
    doPersistenceTasks(cb) {
        var mySite = this.getSite();
        var tasks = [
            //set site to active in mongo
            function (callback) {
                var siteService = new SiteService();
                var dao = new DAO();
                dao.loadByValue('uid', mySite.uid, 'site', function (err, site) {
                    if (_.isError(err)) {
                        return callback(err, null);
                    }

                    if (!site) {
                        mySite.object_type = 'site';
                        site = mySite;
                    }

                    site.hostname = mySite.hostname || site.hostname;
                    site.displayName = mySite.displayName || site.displayName;
                    site.supportedLocales = mySite.supportedLocales || site.supportedLocales;
                    site.defaultLocale = mySite.defaultLocale || site.defaultLocale;

                    siteService.save(site, function (err, result) {
                        if (_.isError(err)) {
                            return cb(err, null);
                        }

                        RequestHandler.loadSite(site);
                        callback(err, result);
                    });
                });
            }
        ];
        async.series(tasks, function (err) {
            cb(err, !_.isError(err));
        });
    }
}

//exports
module.exports = SiteCreateEditJob;
