var util = require('../../../util.js');

module.exports = function LocalizationJobRunnerModule(pb) {

    /**
     * Setup for running localization job.
     * @constructor LocalizationJobRunner
     * @extends ClusterJobRunner
     */
    function LocalizationJobRunner() {
        LocalizationJobRunner.super_.call(this);
    }
    util.inherits(LocalizationJobRunner, pb.ClusterJobRunner);

    /**
     * The site for this instance of LocalizationJobRunner
     * @type {string} - default to empty string
     */
    LocalizationJobRunner.prototype.site = '';

    /**
     * Set the site for an instance of LocalizationJobRunner.
     * @param {Object} options -
     * @param {String} options.uid - site unique id
     * @returns {Object} the instance in which the site was set.
     */
    LocalizationJobRunner.prototype.setSite = function(options) {
        this.site = options.uid;
        return this;
    };

    /**
     * Get the current site of this instance of LocalizationJobRunner.
     * @returns {Object} the site object
     */
    LocalizationJobRunner.prototype.getSite = function() {
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
    LocalizationJobRunner.prototype.processClusterResults = function(err, results, cb) {
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
    return LocalizationJobRunner;
};
