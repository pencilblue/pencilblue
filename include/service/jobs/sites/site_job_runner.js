var util = require('../../../util.js');

module.exports = function SiteJobRunnerModule(pb) {

    /**
     * Setup for running site activation job.
     * @constructor SiteJobRunner
     * @extends ClusterJobRunner
     */
    function SiteJobRunner() {
        SiteJobRunner.super_.call(this);
        
        this.siteService = new pb.SiteService();
    }
    util.inherits(SiteJobRunner, pb.ClusterJobRunner);

    /**
     * The site for this instance of SiteJobRunner
     * @type {string} - default to empty string
     */
    SiteJobRunner.prototype.site = '';

    /**
     * Set the site for an instance of SiteJobRunner.
     * @param {Object} options -
     * @param {String} options.uid - site unique id
     * @param {String} options.hostname - result of site hostname edit/create
     * @param {String} options.displayName - result of site display name edit/create
     * @returns {Object} the instance in which the site was set.
     */
    SiteJobRunner.prototype.setSite = function(options) {
        this.site = options;
        return this;
    };

    /**
     * Get the current site of this instance of SiteJobRunner.
     * @returns {Object} the site object
     */
    SiteJobRunner.prototype.getSite = function() {
        return this.site;
    };

    /**
     *  Called when the tasks have completed execution and isInitiator = FALSE.  The
     * function ispects the results of each processes' execution and attempts to
     * decipher if an error occurred.  The function calls back with a result object
     * that provides four properties: success (Boolean), id (String), pluginUid
     * (String), results (Array of raw results).
     * @override
     * @param {Error} err - error in the process or null
     * @param {Array} results - array of results from the tasks run
     * @param {Function} cb - callback function
     */
    SiteJobRunner.prototype.processClusterResults = function(err, results, cb) {
        if (util.isError(err)) {
            this.log(err.stack);
            return cb(err, results);
        }

        var firstErr;
        var success = true;
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
