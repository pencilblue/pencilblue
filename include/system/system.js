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


function System(){}

//dependencies
var os      = require('os');
var cluster = require('cluster');

//statics
var SHUTDOWN_HOOKS    = {};
var SHUTDOWN_PRIORITY = [];
var IS_SHUTTING_DOWN  = false;
var DISCONNECTS_CNT   = 0;
var DISCONNECTS       = [];

System.onStart = function(onChildRunning) {
    if (cluster.isMaster) {
        System.onMasterRunning();
    }
    else {
        onChildRunning();
    }
};

System.onMasterRunning = function() {

    var workerCnt = os.cpus().length;
    if (pb.config.cluster.workers && pb.config.cluster.workers !== 'auto') {
        workerCnt = pb.config.cluster.workers;
    }

    //spawn workers
    for (var i = 0; i < workerCnt; i++) {
        cluster.fork();
    }
    cluster.on('disconnect', System.onWorkerDisconntect);

    pb.log.info('System[%s]: %d workers spawned. Listening for disconnects.', System.getWorkerId(), workerCnt);
};

System.onWorkerDisconntect = function(worker) {
    pb.log.debug('System[%s]: Worker [%d] disconnected', System.getWorkerId(), worker.id);

    var okToFork = true;
    var currTime = new Date().getTime();

    DISCONNECTS_CNT++;
    DISCONNECTS.push(currTime);

    //splice it down if needed.  Remove first element (FIFO)
    if (DISCONNECTS.length > pb.config.fatal_error_count) {
        DISCONNECTS.splice(0, 1);
    }

    //check for unacceptable failures in specified time frame
    if (DISCONNECTS.length >= pb.config.fatal_error_count) {
        var range = disconnects[disconnects.length - 1] - disconnects[disconnects.length - config.fatal_error_count];
        if (range <= config.cluster.fatal_error_timeout) {
            okToFork = false;
        }
        else {
            pb.log.silly("System[%s]: Still within acceptable fault tolerance.  TOTAL_DISCONNECTS=[%d] RANGE=[%d]", System.getWorkerId(), disconnectCnt, pb.config.fatal_error_count, range);
        }
    }

    if (okToFork && !System.isShuttingDown()) {
        var worker = cluster.fork();
        log.silly("System[%s] Forked worker [%d]", System.getWorkerId(), worker ? worker.id : 'FAILED');
    }
    else if (!System.isShuttingDown()){
       log.error("System[%s]: %d failures have occurred within %sms.  Bailing out.", System.getWorkerId(), pb.config.fatal_error_count, pb.config.fatal_error_timeout);
        process.kill();
    }
};

System.isShuttingDown = function() {
    return IS_SHUTTING_DOWN;
};

System.getWorkerId = function() {
    return cluster.worker ? cluster.worker.id : 'M';
};

System.registerShutdownHook = function(name, shutdownHook) {
    if (typeof name !== 'string') {
        throw new Error('A name must be provided for every shutdown hook');
    }
    SHUTDOWN_HOOKS[name] = shutdownHook;
    SHUTDOWN_PRIORITY.push(name);
};

System.shutdown = function() {
    pb.log.debug('System[%s]: Shutting down...', System.getWorkerId());

    var toh   = null;
    var tasks = pb.utils.getTasks(SHUTDOWN_PRIORITY, function(keys, i) {
        return function(callback) {

            var timeoutHandle = setTimeout(function() {
                timeoutHandle = null;
                //TODO log & make timeout configurable
                callback(null, false);
            }, 100);

            var d = domain.create();
            d.run(function() {
                pb.log.debug('System[%s]: Calling [%s] shutdown hook', System.getWorkerId(), keys[i]);
                SHUTDOWN_HOOKS[keys[i]](function(err, result) {
                    if (timeoutHandle) {
                        clearTimeout(timeoutHandle);
                        timeoutHandle = null;
                        callback(null, result);
                    }
                });
            });
            d.on('error', function(err) {
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle);
                    timeoutHandle = null;
                }
                //TODO log
                callback(null, false);
            });
        };
    });
    async.parallel(tasks.reverse(), function(err, results) {
        pb.log.info('System[%s]: Shutdown complete', System.getWorkerId());
        if (toh) {
            clearTimeout(toh);
            toh = null;
        }
        process.exit();
    });

    toh = setTimeout(function() {
       log.info("System[%s]: Shutdown completed but was forced", System.getWorkerId());
       process.exit();
    }, 5*1000);
};

//register with OS
// listen for TERM signal .e.g. kill
process.on ('SIGTERM', function() {
    log.debug('System[%s]: SIGTERM detected %s', System.getWorkerId(), IS_SHUTTING_DOWN ? 'but is already shutting down' : '');
    if (!IS_SHUTTING_DOWN) {
        System.shutdown();
    }
});

// listen for INT signal e.g. Ctrl-C
process.on ('SIGINT', function() {
    log.debug('System[%s]: SIGINT detected %s', System.getWorkerId(), IS_SHUTTING_DOWN ? 'but is already shutting down' : '');
    if (!IS_SHUTTING_DOWN) {
        System.shutdown();
    }
});

//exports
module.exports = System;
