
//dependencies
var async = require('async');
var util  = require('../../../util.js');

module.exports = function MaintenanceActivateJobModule(pb) {

    /**
     * Job to activate Maintenance.
     * @class MaintenanceActivateJob
     * @constructor MaintenanceActivateJob
     * @extends SiteJobRunner
     */
    function MaintenanceActivateJob(){
        MaintenanceActivateJob.super_.call(this);

        //initialize
        this.init();
        this.setParallelLimit(1);
    }
    util.inherits(MaintenanceActivateJob, pb.SiteJobRunner);

    /**
     * Get tasks to activate maintenance mode for a site.
     * @method getInitiatorTasks
     * @override
     * @param {Function} cb - callback function
     */
    MaintenanceActivateJob.prototype.getInitiatorTasks = function(cb) {
        var self = this;

        var jobId = self.getId();
        var site = self.getSite();
        var activeMaintenanceCommand = {
            jobId: jobId,
            site: site
        };

        //progress function
        var tasks = [
            //activate maintenance in mongo
            function(callback) {
                self.doPersistenceTasks(function(err, results) {
                  console.log(JSON.stringify(tasks))
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
     * Update maintenance to active as true in database to activate.
     * @method doPersistenceTasks
     * @param {Function} cb - callback
     */
    MaintenanceActivateJob.prototype.doPersistenceTasks = function(cb) {
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

                    site.maintenance = true;
                    console.log(site)
                    dao.save(site, function(err, result) {
                        if(util.isError(err)) {
                            return cb(err, null);
                        }

                        pb.RequestHandler.activateMaintenance(site);
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
    return MaintenanceActivateJob;
};
