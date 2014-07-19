/*
    Copyright (C) 2014  PencilBlue, LLC

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

//dependencies
var JobRunner = require('./job_runner.js');

/**
 *
 * @class AsyncJobRunner
 * @constructor
 */
function AsyncJobRunner() {}

//ineritance
util.inherits(AsyncJobRunner, JobRunner);

AsyncJobRunner.prototype.parallelLimit = 1;

AsyncJobRunner.prototype.setParallelLimit = function(max) {
   this.parallelLimit = max;
};

AsyncJobRunner.prototype.run = function(cb) {
    var self = this;

    var d = domain.create();
    d.once('error', cb);
    d.run(function() {

        self.getTasks(function(err, tasks){
            if (util.isError(err)) {
                throw err;
            }

            if (self.parallelLimit <= 1) {
                async.series(tasks, cb);
            }
            else {
                async.parallelLimit(tasks, self.parallelLimit, cb);
            }
        });
    });
};

AsyncJobRunner.prototype.getTasks = function() {
    throw new Error('The getTasks function must be overriden by an extending prototype');
};

//exports
module.exports = AsyncJobRunner;
