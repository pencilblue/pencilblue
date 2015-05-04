var util = require('../../../util.js');

module.exports = function SiteJobRunnerModule(pb) {

    function SiteJobRunner() {
        SiteJobRunner.super_.call(this);
        
        this.siteService = new pb.SiteService();
    };
    util.inherits(SiteJobRunner, pb.ClusterJobRunner);

    SiteJobRunner.prototype.site = '';

    SiteJobRunner.prototype.setSite = function(site) {
        this.site = site;
        return this;
    }

    SiteJobRunner.prototype.getSite = function() {
        return this.site;
    }

    SiteJobRunner.prototype.processClusterResults = function(err, results, cb) {
        if (util.isError(err)) {
            this.log(err.stack);
            cb(err, results);
            return;
        }

        var firstErr = undefined;
        var success  = true;
        for (var i = 0; i < results.length; i++) {
            if (!results[i]) {
                firstErr = util.format('An error occurred while attempting to execute the job for site [%s]. RESULT=[%s] TASK=[%d]', this.getSite(), util.inspect(results[i]), i);
                success = false;
                break;
            }
        }

        //log any errors
        if (firstErr) {
            this.log(firstErr);
        }

        //callback with result
        var result = {
            success: success,
            id: this.getId(),
            site: this.getSite(),
            error: firstErr,
            results: results
        };
        cb(err, result);
    };

    //exports
    return SiteJobRunner;
};