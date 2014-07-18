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

/**
 *
 * @class AsyncJobRunner
 * @constructor
 */
function JobRunner(){

    /**
     *
     * @property dao
     * @type {DAO}
     */
    this.dao = null;

    /**
     *
     * @property id
     * @type {String}
     */
    this.id = null;
}

//constants
var JOB_LOG_STORE_NAME = 'job_log';

JobRunner.prototype.init = function(name) {
    this.name = name;
    this.dao  = new pb.DAO();
    this.id   = pb.utils.uniqueId().toString();
}

JobRunner.prototype.run = function(cb) {
    throw new Error('This function must be overriden by an extending prototype');
};

JobRunner.prototype.log = function() {


    if (arguments.length > 0) {
        arguments[0] = this.name+': '+arguments[0];

        var meta    = [];
        var message = arguments[0];
        if (arguments.length > 1) {

            meta = arguments.splice(0,1);
            message = util.format(message, meta);
        }
        var statement = {
            object_type: JOB_LOG_STORE_NAME,
            job_id: this.id,
            worker_id: pb.system.getWorkerId(),
            name: this.name,
            message: message,
            metadata: meta
        };
        this.dao.save(statement);
        pb.log.debug.apply(pb.log, arguments);
    }
};

//exports
module.exports = JobRunner;
