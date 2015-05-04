
//dependencies
var async = require('async');
var util  = require('../../../util.js');

module.exports = function SiteDeactivateJobModule(pb) {
    var GLOBAL_PREFIX = 'global';

    function SiteDeactivateJob(){
        SiteDeactivateJob.super_.call(this);

        //initialize
        this.init();
        this.setParallelLimit(1);
    };
    util.inherits(SiteDeactivateJob, pb.SiteJobRunner);

    SiteDeactivateJob.prototype.getInitiatorTasks = function(cb) {
        var self = this;

        var activateCommand = {};

        //progress function
        var jobId     = self.getId();
        var site      = self.getSite();
        var tasks = [
            //activate site in mongo
            function(callback) {
                self.doPersistenceTasks(function(err, results) {
                    self.onUpdate(100 / tasks.length);
                    if (util.isError(err)) {
                        self.log(err.stack);
                    }
                    callback(err, results);
                });
            },

            //add site to request handler site collection across cluster
            self.createCommandTask('deactivate_site', activateCommand)
        ];
        cb(null, tasks);
    };

    SiteDeactivateJob.prototype.getWorkerTasks = function(cb) {
        var self = this;

        var pluginUid = this.getPluginUid();
        var site = this.getSite();
        var tasks = [

            //allow traffic to start routing for site
            function(callback) {
                self.siteService.stopAcceptingSiteTraffic(site, callback);
            }
        ];
        cb(null, tasks);
    };

    /**
     *
     * @method doPersistenceTasks
     */
    SiteDeactivateJob.prototype.doPersistenceTasks = function(cb) {
        var self = this;

        var siteUid   = this.getSite();
        var tasks     = [
            //set site to active in mongo
            function(callback) {
                var dao = new pb.DAO();
                dao.loadByValue('uid', siteUid, 'site', function(err, site) {
                    if(util.isError(err)) {
                        callback(err, null)
                    } else if (!site) {
                        callback(new Error('Site not found'), null);
                    } else {
                        site.active = false;
                        dao.save(site, function(err, result) {
                            if(util.isError(err)) {
                                cb(err, null);
                                return;
                            }

                            pb.RequestHandler.unloadSite(site);
                            callback(err, result);
                        });
                    }
                });
            }
        ];
        async.series(tasks, function(err, results) {
            if(util.isError(err)) {
                cb(err);
                return;
            }
            cb(null, true);
        });
    };

    //exports
    return SiteDeactivateJob;
};
