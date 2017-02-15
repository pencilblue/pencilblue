
//dependencies
var async = require('async');
var util  = require('../../../util.js');

module.exports = function MaintenanceDeactivateJobModule(pb) {

    /**
     * Job to Deactivate Maintenance.
     * @class MaintenanceDeactivateJob
     * @constructor MaintenanceDeactivateJob
     * @extends SiteJobRunner
     */
    function MaintenanceDeactivateJob(){
        MaintenanceDeactivateJob.super_.call(this);

        //initialize
        this.init();
        this.setParallelLimit(1);
    }
    util.inherits(MaintenanceDeactivateJob, pb.SiteJobRunner);

    /**
     * Get tasks to Deactivate maintenance mode for a site.
     * @method getInitiatorTasks
     * @override
     * @param {Function} cb - callback function
     */
    MaintenanceDeactivateJob.prototype.getInitiatorTasks = function(cb) {
        var self = this;

        var jobId = self.getId();
        var site = self.getSite();
        var deactiveMaintenanceCommand = {
            jobId: jobId,
            site: site
        };

        //progress function
        var tasks = [
            //Deactivate maintenance in mongo
            function(callback) {
                self.doPersistenceTasks(function(err, results) {
                    self.onUpdate(100 / tasks.length);
                    if (util.isError(err)) {
                        self.log(err.stack);
                    }
                    callback(err, results);
                });
            }
        ];
        cb(null, tasks);
    };

    /**
     * Update maintenance to active as false in database to Deactivate.
     * @method doPersistenceTasks
     * @param {Function} cb - callback
     */
    MaintenanceDeactivateJob.prototype.doPersistenceTasks = function(cb) {
        var site   = this.getSite();
        var tasks     = [
            //set site to deactive in mongo
            function(callback) {
                var dao = new pb.DAO();
                dao.loadByValue('uid', site.uid, 'site', function(err, site) {
                    if(util.isError(err)) {
                        return callback(err, null);
                    }

                    if (!site) {
                        return callback(new Error('Site not found'), null);
                    }

                    site.maintenance = false;
                    dao.save(site, function(err, result) {
                        if(util.isError(err)) {
                            return cb(err, null);
                        }

                        pb.RequestHandler.deactivateMaintenance(site);
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
    return MaintenanceDeactivateJob;
};
