
//dependencies
var async = require('async');
var util  = require('../../../util.js');

module.exports = function SiteDeactivateJobModule(pb) {

    /**
     * Job to deactivate a site.
     * @class SiteDeactivateJob
     * @constructor SiteDeactivateJob
     * @extends SiteJobRunner
     */
    function SiteDeactivateJob(){
        SiteDeactivateJob.super_.call(this);

        //initialize
        this.init();
        this.setParallelLimit(1);
    }
    util.inherits(SiteDeactivateJob, pb.SiteJobRunner);

    /**
     * Get tasks to deactivate a site.
     * @method getInitiatorTasks
     * @override
     * @param {Function} cb - callback function
     */
    SiteDeactivateJob.prototype.getInitiatorTasks = function(cb) {
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
            function(callback) {
                self.doPersistenceTasks(function(err, results) {
                    self.onUpdate(100 / tasks.length);
                    if (util.isError(err)) {
                        self.log(err.stack);
                    }
                    callback(err, results);
                });
            },

            //remove site to request handler site collection across cluster
            self.createCommandTask('deactivate_site', deactivateCommand)
        ];
        cb(null, tasks);
    };

    /**
     * Get task to stop accepting traffic for the site.
     * @method getWorkerTasks
     * @override
     * @param {Function} cb - callback
     */
    SiteDeactivateJob.prototype.getWorkerTasks = function(cb) {
        var self = this;

        var site = this.getSite();
        var tasks = [

            //allow traffic to start routing for site
            function(callback) {
                self.siteService.stopAcceptingSiteTraffic(site.uid, callback);
            }
        ];
        cb(null, tasks);
    };

    /**
     * Update site to active as false in database to deactivate.
     * @method doPersistenceTasks
     * @param {Function} cb - callback
     */
    SiteDeactivateJob.prototype.doPersistenceTasks = function(cb) {

        var site   = this.getSite();
        var tasks     = [
            //set site to active in mongo
            function(callback) {
                var dao = new pb.DAO();
                dao.loadByValue('uid', site.uid, 'site', function(err, site) {
                    if(util.isError(err)) {
                        return callback(err, null);
                    }

                    if (!site) {
                        return callback(new Error('Site not found'), null);
                    }

                    site.active = false;
                    dao.save(site, function(err, result) {
                        if(util.isError(err)) {
                            return cb(err, null);
                        }

                        pb.RequestHandler.deactivateSite(site);
                        callback(err, result);
                    });
                });
            }
        ];
        async.series(tasks, function(err/*, results*/) {
            cb(err, !util.isError(err));
        });
    };

    //exports
    return SiteDeactivateJob;
};
