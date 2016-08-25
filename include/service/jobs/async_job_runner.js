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
var async     = require('async');
var domain    = require('domain');
var util      = require('../../util.js');

module.exports = function AsyncJobRunnerModule(pb) {

    /**
     * An abstract implementation of JobRunner that handles performing a series of
     * asynchronous tasks.  The runner provides the ability to run the tasks in
     * parallel or 1 after another.  The extending implementation must provides the
     * set of tasks to execute
     * @class AsyncJobRunner
     * @constructor
     * @extends JobRunner
     */
    function AsyncJobRunner() {
        AsyncJobRunner.super_.call(this);
    }
    util.inherits(AsyncJobRunner, pb.JobRunner);

    /**
     * The number of tasks to run in parallel
     * @property parallelLimit
     * @type {Integer}
     */
    AsyncJobRunner.prototype.parallelLimit = 1;

    /**
     * Sets the number of tasks to run in parallel
     * @method setParallelLimit
     * @param {Integer} max The maximum number of tasks to run in parallel
     */
    AsyncJobRunner.prototype.setParallelLimit = function(max) {
       this.parallelLimit = max;
    };

    /**
     * Kicks off the set of tasks for the job.  The implementation wraps the items
     * in a domain in an attempt to provide a level of error handling.  When a
     * qualifying error is intercepted by the domain processResults is called
     * providing the error and all other task execution is halted.
     * @see JobRunner#run
     * @method run
     * @param {Function} cb
     */
    AsyncJobRunner.prototype.run = function(cb) {
        var self = this;

        var d = domain.create();
        d.on('error', function(err) {
            self.processResults(err, null, cb);
        });
        d.run(function() {
            process.nextTick(function() {

                self.getTasks(function(err, tasks){
                    if (util.isError(err)) {
                        throw err;
                    }

                    self.onBeforeFirstTask(function(err) {
                        if (util.isError(err)) {
                            throw err;
                        }

                        if (self.parallelLimit <= 1) {
                            async.series(tasks, function(err, results) {
                                self.processResults(err, results, cb);
                            });
                        }
                        else {
                            async.parallelLimit(tasks, self.parallelLimit, function(err, results) {
                                self.processResults(err, results, cb);
                            });
                        }
                    });
                });
            });
        });
    };

    /**
     * Responsible for providing an array or hash of tasks that will be executed by
     * the job.  The extending implmentation MUST override this function or an
     * error will be thrown.
     * @method getTasks
     * @param {Function} cb A callback that takes two parameters: cb(Error, Object|Array)
     */
    AsyncJobRunner.prototype.getTasks = function(cb) {
        throw new Error('The getTasks function must be overriden by an extending prototype');
    };

    /**
     * Called once after job execution.  It is recommended that extending
     * implmentations use this function to peform any ETL operations to prepare
     * data for the callback.
     * @method processResults
     * @param {Error} err The error generated during task execution if exists
     * @param {Object|Array} results The result of each tasks' execution.
     */
    AsyncJobRunner.prototype.processResults = function(err, results, cb) {
        cb(err, results);
    };

    /**
     * Called directly before the first tasks begins to execute.  It is recommended
     * that the extending implementation override this function in order to call
     * the "onStart" function.
     * @method onBeforeFirstTask
     * @param {Function} cb A callback that takes one optional error parameter
     */
    AsyncJobRunner.prototype.onBeforeFirstTask = function(cb) {
        cb(null);
    };

    return AsyncJobRunner;
};
