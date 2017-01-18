
//dependencies
var _ = require('lodash');
var async = require('async');
var DAO = require('../../../dao/dao');
var RequestHandler = require('../../../http/request_handler');
var SiteJobRunner = require('./site_job_runner');

/**
 * Job to activate a site in the database to start accepting traffic.
 * @param {object} context
 * @param {object} [context.site]
 * @param {SiteService} context.siteService
 * @extends SiteJobRunner
 */
class SiteActivateJob extends SiteJobRunner {
    constructor(context) {
        super(context);

        //initialize
        this.init();
        this.setParallelLimit(1);
    }

    /**
     * Get tasks to activate sites across clusters.
     * @method getInitiatorTasks
     * @override
     * @param {Function} cb - callback function
     */
    getInitiatorTasks (cb) {
        var self = this;
        //progress function
        var jobId = self.getId();
        var site = self.getSite();

        var activateCommand = {
            jobId: jobId,
            site: site
        };

        var tasks = [
            //activate site in mongo
            function (callback) {
                self.doPersistenceTasks(function (err, results) {
                    self.onUpdate(100 / tasks.length);
                    if (_.isError(err)) {
                        self.log(err.stack);
                    }
                    callback(err, results);
                });
            },

            //add site to request handler site collection across cluster
            self.createCommandTask('activate_site', activateCommand)
        ];
        cb(null, tasks);
    }

    /**
     * Get tasks to activate user facing, non-admin routes for the site.
     * @method getWorkerTasks
     * @override
     * @param {Function} cb - callback function
     */
    getWorkerTasks (cb) {
        var self = this;
        var site = this.getSite();
        var tasks = [

            //allow traffic to start routing for site
            function (callback) {
                self.siteService.startAcceptingSiteTraffic(site.uid, callback);
            }
        ];
        cb(null, tasks);
    }

    /**
     * Set sites active in the database and activate the site in the RequestHandler.
     * @method doPersistenceTasks
     * @param {Function} cb - callback function
     */
    doPersistenceTasks (cb) {
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

                    site.active = true;
                    dao.save(site, function (err, result) {
                        if (_.isError(err)) {
                            return cb(err, null);
                        }

                        RequestHandler.activateSite(site);
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
module.exports = SiteActivateJob;
