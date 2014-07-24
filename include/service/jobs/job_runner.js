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
var JOB_STORE_NAME     = 'job_run';

var DEFAULT_START_STATUS = 'RUNNING';
var DEFAULT_DONE_STATUS  = 'COMPLETED';
var DEFAULT_ERROR_STATUS = 'ERRORED';

JobRunner.prototype.init = function(name, jobId) {
    this.name = name;
    this.dao  = new pb.DAO();
    this.id   = jobId || pb.utils.uniqueId().toString();
    return this;
}

JobRunner.prototype.getId = function() {
    return this.id;
};

JobRunner.prototype.run = function(cb) {
    throw new Error('This function must be overriden by an extending prototype');
};

JobRunner.prototype.log = function() {

    var args = Array.prototype.splice.call(arguments, 0);console.log('***ARGS='+util.inspect(args));
    if (args.length > 0) {
        args[0] = this.name+': '+args[0];

        var meta    = [];
        var message = args[0];
        if (args.length > 1) {console.log('**MSG2='+message);

            var slice = pb.utils.clone(args);
            slice.splice(0,1);console.log('********HERE********'+util.inspect(slice));
            message = util.format.apply(util, args);console.log('**MSG2='+message);
        }
        var statement = {
            object_type: JOB_LOG_STORE_NAME,
            job_id: this.id,
            worker_id: pb.system.getWorkerId(),
            name: this.name,
            message: message,
            metadata: meta
        };
        this.dao.update(statement);
        pb.log.debug.apply(pb.log, args);
    }
};

JobRunner.prototype.onStart = function(status) {
    var job         = pb.DAO.getIDWhere(this.getId());
    job.object_type = JOB_STORE_NAME;
    job.name        = this.name;
    job.status      = status || DEFAULT_START_STATUS;
    job.progress    = 0;
    this.dao.update(job).then(function(result) {
        if (util.isError(result)) {
            pb.log.error('JobRunner: Failed to mark job as started', result.stack);
        }
    });
};

JobRunner.prototype.onUpdate = function(progressIncrement, status) {
    this.log('Updating job [%s:%s] by %s percent with status: %s', this.getId(), this.name, progressIncrement, status);

    var query = pb.DAO.getIDWhere(this.getId());
    var updates = {
        '$set': {},
        '$inc': {}
    };
    if (pb.validation.isInt(progressIncrement, true, true)) {
        updates['$inc'] = {progress: progressIncrement};
    }
    if (pb.validation.validateNonEmptyStr(status, true)) {
        updates['$set'] = {status: status};
    }

    this.dao.updateFields(JOB_STORE_NAME, query, updates, function(err, result) {
        if (util.isError(err)) {
            pb.log.error('JobRunner: Failed to update job progress', err.stack);
        }
    });
};

JobRunner.prototype.onCompleted = function(status, err) {
    if (util.isError(status)) {
        err = status;
        status = DEFAULT_ERROR_STATUS;
    }
    else if (!status) {
        status = DEFAULT_DONE_STATUS;
    }

    //log result
    this.log('Setting job [%s:%s] as completed with status: %s', this.getId(), this.name, status);

    //persist result
    var query = pb.DAO.getIDWhere(this.getId());
    var sets  = {
        $set: {
            status: status,
            progress: 100,
            error: err ? err.stack : undefined
        }
    };
    this.dao.updateFields(JOB_STORE_NAME, query, sets, function(err, result) {
        if (util.isError(err)) {
            pb.log.error('JobRunner: Failed to update job progress', err.stack);
        }
    });
};

//exports
module.exports = JobRunner;
