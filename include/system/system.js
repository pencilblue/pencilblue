/*
    Copyright (C) 2015  PencilBlue, LLC

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
var os      = require('os');
var cluster = require('cluster');
var process = require('process');
var async   = require('async');
var domain  = require('domain');
var util    = require('../util.js');

/**
 *
 * @class System
 * @constructor
 * @param {Object} pb The PencilBlue namespace
 */
module.exports = function System(pb){

    //pb dependencies
    var log = pb.log;

    /**
     *
     * @private
     * @static
     * @property
     * @type {Object}
     */
    var SHUTDOWN_HOOKS = {};

    /**
     *
     * @private
     * @property SHUTDOWN_PRIORITY
     * @type {Array}
     */
    var SHUTDOWN_PRIORITY = [];

    /**
     *
     * @private
     * @property IS_SHUTTING_DOWN
     * @type {Boolean}
     */
    var IS_SHUTTING_DOWN = false;

    /**
     *
     * @private
     * @property DISCONNECTS_CNT
     * @type {Integer}
     */
    var DISCONNECTS_CNT = 0;

    /**
     *
     * @private
     * @property DISCONNECTS
     * @type {Array}
     */
    var DISCONNECTS = [];

    /**
     *
     * @private
     * @readonly
     * @property FORCE_PROCESS_EXIT_TIMEOUT
     * @type {Array}
     */
    var FORCE_PROCESS_EXIT_TIMEOUT = 5*1000;

    /**
     *
     * @method onStart
     * @param {Function} onChildRunning
     */
    this.onStart = function(onChildRunning) {
        if (pb.config.cluster.self_managed && cluster.isMaster) {
            this.onMasterRunning();
        }
        else {
            if (!pb.config.cluster.self_managed) {
                pb.log.debug('System: Running in managed mode');
            }
            onChildRunning();
        }
    };

    /**
     *
     * @method
     */
    this.onMasterRunning = function() {

        var workerCnt = os.cpus().length;
        if (pb.config.cluster.workers && pb.config.cluster.workers !== 'auto') {
            workerCnt = pb.config.cluster.workers;
        }

        //spawn workers
        for (var i = 0; i < workerCnt; i++) {
            cluster.fork();
        }

        var self = this;
        cluster.on('disconnect', function(worker) {
            self.onWorkerDisconntect(worker)
        });

        pb.log.info('System[%s]: %d workers spawned. Listening for disconnects.', this.getWorkerId(), workerCnt);
    };

    /**
     *
     * @method
     */
    this.onWorkerDisconntect = function(worker) {
        pb.log.debug('System[%s]: Worker [%d] disconnected', this.getWorkerId(), worker.id);

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
            var range = DISCONNECTS[DISCONNECTS.length - 1] - DISCONNECTS[DISCONNECTS.length - config.fatal_error_count];
            if (range <= config.cluster.fatal_error_timeout) {
                okToFork = false;
            }
            else {
                pb.log.silly("System[%s]: Still within acceptable fault tolerance.  TOTAL_DISCONNECTS=[%d] RANGE=[%d]", this.getWorkerId(), disconnectCnt, pb.config.fatal_error_count, range);
            }
        }

        if (okToFork && !this.isShuttingDown()) {
            var worker = cluster.fork();
            pb.log.silly("System[%s] Forked worker [%d]", this.getWorkerId(), worker ? worker.id : 'FAILED');
        }
        else if (!this.isShuttingDown()){
           pb.log.error("System[%s]: %d failures have occurred within %sms.  Bailing out.", this.getWorkerId(), pb.config.fatal_error_count, pb.config.fatal_error_timeout);
            process.kill();
        }
    };

    /**
     *
     * @method
     */
    this.isShuttingDown = function() {
        return IS_SHUTTING_DOWN;
    };

    /**
     *
     * @method
     */
    this.getWorkerId = function() {
        return cluster.worker ? cluster.worker.id : 'M';
    };

    /**
     *
     * @method
     */
    this.registerShutdownHook = function(name, shutdownHook) {
        if (typeof name !== 'string') {
            throw new Error('A name must be provided for every shutdown hook');
        }
        SHUTDOWN_HOOKS[name] = shutdownHook;
        SHUTDOWN_PRIORITY.push(name);
    };

    /**
     * Calls shutdown on all registered system services and kills the process
     * @method shutdown
     * @param {Boolean} [killProcess=true]
     */
    this.shutdown = function(killProcess, cb) {
        if (util.isFunction(killProcess)) {
            cb = killProcess;
            killProcess = true;
        }
        if (!util.isFunction(cb)) {
            cb = util.cb;
        }

        //notify of shutdown
        var self = this;
        pb.log.debug('System[%s]: Shutting down...', this.getWorkerId());

        //create tasks to shutdown registered services in parallel
        var toh   = null;
        var tasks = util.getTasks(SHUTDOWN_PRIORITY, function(keys, i) {
            return function(callback) {

                var timeoutHandle = setTimeout(function() {
                    timeoutHandle = null;
                    //TODO log & make timeout configurable
                    callback(null, false);
                }, 100);

                var d = domain.create();
                d.run(function() {
                    pb.log.debug('System[%s]: Calling [%s] shutdown hook', self.getWorkerId(), keys[i]);
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
            pb.log.info('System[%s]: Shutdown complete', self.getWorkerId());
            if (toh) {
                clearTimeout(toh);
                toh = null;
            }

            //kill off the process when instructed
            if (killProcess) {
                process.exit();
            }
        });

        //create fallback so that when services do not shutdown within 5 seconds the process is forced to terminate
        if (killProcess) {
            toh = setTimeout(function() {
               log.info("System[%s]: Shutdown completed but was forced", self.getWorkerId());
                process.exit();
            }, FORCE_PROCESS_EXIT_TIMEOUT);
        }

    };

    /**
     * Registers signal handlers (SIGTERM, SIGINT) that will call shutdown when
     * triggered
     * @method registerSignalHandlers
     * @param {Boolean} [killProcess] When TRUE or not provided the variable
     * instructs the handlers to kill off the process in addition to shutting
     * down PencilBlue services
     */
    this.registerSignalHandlers = function(killProcess) {
        var self = this;

        //determine if th process should be killed off
        killProcess = killProcess || util.isNullOrUndefined(killProcess);

        // listen for TERM signal .e.g. kill
        process.on ('SIGTERM', function() {
            log.debug('System[%s]: SIGTERM detected %s', self.getWorkerId(), IS_SHUTTING_DOWN ? 'but is already shutting down' : '');
            if (!IS_SHUTTING_DOWN) {
                self.shutdown(killProcess);
            }
        });

        // listen for INT signal e.g. Ctrl-C
        process.on ('SIGINT', function() {
            log.debug('System[%s]: SIGINT detected %s', self.getWorkerId(), IS_SHUTTING_DOWN ? 'but is already shutting down' : '');
            if (!IS_SHUTTING_DOWN) {
                self.shutdown(killProcess);
            }
        });

        process.on ('uncaughtException', function(err) {
            log.error('System[%s]: uncaught Exception detected %s: %s', self.getWorkerId(), IS_SHUTTING_DOWN ? 'but is already shutting down' : '', err.stack);
            if (!IS_SHUTTING_DOWN) {
                self.shutdown(killProcess);
            }
        });
    };
};
