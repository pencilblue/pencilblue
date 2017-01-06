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
var ClusterJobRunner = require('../cluster_job_runner');
var util = require('util');

/**
 * Setup for running site activation job.
 * @param {object} context
 * @param {object} [context.site]
 * @param {SiteService} context.siteService
 * @extends ClusterJobRunner
 */
class SiteJobRunner extends ClusterJobRunner {
    constructor (context) {
        super();

        /**
         * @type {SiteService}
         */
        this.siteService = context.siteService;

        /**
         * The site for this instance of SiteJobRunner
         * @type {string} - default to null
         */
        this.site = context.site || null;
    }

    /**
     * Set the site for an instance of SiteJobRunner.
     * @method setSite
     * @param {Object} options -
     * @param {String} options.uid - site unique id
     * @param {String} options.hostname - result of site hostname edit/create
     * @param {String} options.displayName - result of site display name edit/create
     * @return {Object} the instance in which the site was set.
     */
    setSite (options) {
        this.site = options;
        return this;
    }

    /**
     * Get the current site of this instance of SiteJobRunner.
     * @method getSite
     * @return {Object} the site object
     */
    getSite () {
        return this.site;
    }

    /**
     *  Called when the tasks have completed execution and isInitiator = FALSE.  The
     * function ispects the results of each processes' execution and attempts to
     * decipher if an error occurred.  The function calls back with a result object
     * that provides four properties: success (Boolean), id (String), pluginUid
     * (String), results (Array of raw results).
     * @override
     * @method processClusterResults
     * @param {Error} err - error in the process or null
     * @param {Array} results - array of results from the tasks run
     * @param {Function} cb - callback function
     */
    processClusterResults (err, results, cb) {
        if (_.isError(err)) {
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
    }
}

module.exports = SiteJobRunner;
