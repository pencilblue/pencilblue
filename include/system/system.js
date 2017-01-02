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
var Q = require('q');
var os      = require('os');
var cluster = require('cluster');
var async   = require('async');
var domain  = require('domain');
var log = require('../utils/logging').newInstance('System');
var config = require('../config').activeConfiguration;


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
 * Controls the process the handling and startup procedure
 */
class System {

    /**
     * Called during system startup.  It inspects the configuration and the process type to determine how the platform
     * should initialize
     * @param {function} onChildRunning
     */
    static onStart (onChildRunning) {
        if (config.cluster.self_managed && cluster.isMaster) {
            System.onMasterRunning();
        }
        else {
            if (!config.cluster.self_managed) {
                log.debug('Running in managed mode');
            }
            onChildRunning();
        }
    }

    /**
     * Called once when the process is the master process in self managed mode. Responsible for spawning child processes
     */
    static onMasterRunning () {

        var workerCnt = os.cpus().length;
        if (config.cluster.workers && config.cluster.workers !== 'auto') {
            workerCnt = config.cluster.workers;
        }

        //spawn workers
        for (var i = 0; i < workerCnt; i++) {
            cluster.fork();
        }

        cluster.on('disconnect', System.onWorkerDisconnect);

        log.info('%d workers spawned. Listening for disconnects.', System.getWorkerId(), workerCnt);
    }

    /**
     * @param {Worker} worker
     */
    static onWorkerDisconnect (worker) {
        log.debug('Worker [%d] disconnected', System.getWorkerId(), worker.id);

        var okToFork = true;
        var currTime = new Date().getTime();

        DISCONNECTS_CNT++;
        DISCONNECTS.push(currTime);

        //splice it down if needed.  Remove first element (FIFO)
        if (DISCONNECTS.length > config.cluster.fatal_error_count) {
            DISCONNECTS.splice(0, 1);
        }

        //check for unacceptable failures in specified time frame
        if (DISCONNECTS.length >= config.cluster.fatal_error_count) {
            var range = DISCONNECTS[DISCONNECTS.length - 1] - DISCONNECTS[DISCONNECTS.length - config.cluster.fatal_error_count];
            if (range <= config.cluster.fatal_error_timeout) {
                okToFork = false;
            }
            else {
                log.silly('Still within acceptable fault tolerance.  TOTAL_DISCONNECTS=[%d] RANGE=[%d]', System.getWorkerId(), DISCONNECTS_CNT, config.cluster.fatal_error_count, range);
            }
        }

        if (okToFork && !System.isShuttingDown()) {
            worker = cluster.fork();
            log.silly('Forked worker [%d]', System.getWorkerId(), worker ? worker.id : 'FAILED');
        }
        else if (!System.isShuttingDown()){
            log.error('%d failures have occurred within %sms.  Bailing out.', System.getWorkerId(), config.cluster.fatal_error_count, config.fatal_error_timeout);
            process.kill();
        }
    }

    /**
     * @return {boolean}
     */
    static isShuttingDown () {
        return IS_SHUTTING_DOWN;
    }

    /**
     * @return {string}
     */
    static getWorkerId () {
        return cluster.worker ? cluster.worker.id : 'M';
    }

    /**
     * @param {string} name
     * @param {function} shutdownHook
     * @return {boolean}
     */
    static registerShutdownHook (name, shutdownHook) {
        if (typeof name !== 'string' || typeof shutdownHook !== 'function') {
            return false;
        }
        SHUTDOWN_HOOKS[name] = shutdownHook;
        SHUTDOWN_PRIORITY.push(name);
        return true;
    }

    /**
     * Calls shutdown on all registered system services and kills the process
     * @param {boolean} [killProcess=true]
     */
    static shutdown (killProcess) {
        if (typeof killProcess !== 'boolean') {
            killProcess = true;
        }

        //notify of shutdown
        log.debug('Shutting down...');

        //call shutdown hooks
        return SHUTDOWN_PRIORITY.reverse().reduce(function(chain, key) {
            return chain.then(function() {
                return Q.timeout(SHUTDOWN_HOOKS[key](), 100);
            });
        }, Q()).then(function() {
            log.info('Shutdown Complete');

            //kill off the process when instructed
            if (killProcess) {
                process.exit();
            }
        });
    }

    /**
     * Registers signal handlers (SIGTERM, SIGINT) that will call shutdown when
     * triggered
     * @param {boolean} [killProcess] When TRUE or not provided the variable
     * instructs the handlers to kill off the process in addition to shutting
     * down PencilBlue services
     */
    static registerSignalHandlers (killProcess) {

        //determine if th process should be killed off
        killProcess = killProcess || _.isNil(killProcess);

        // listen for TERM signal .e.g. kill
        process.on ('SIGTERM', function() {
            log.debug('SIGTERM detected %s', System.getWorkerId(), IS_SHUTTING_DOWN ? 'but is already shutting down' : '');
            if (!IS_SHUTTING_DOWN) {
                System.shutdown(killProcess);
            }
        });

        // listen for INT signal e.g. Ctrl-C
        process.on ('SIGINT', function() {
            log.debug('SIGINT detected %s', System.getWorkerId(), IS_SHUTTING_DOWN ? 'but is already shutting down' : '');
            if (!IS_SHUTTING_DOWN) {
                System.shutdown(killProcess);
            }
        });

        process.on ('uncaughtException', function(err) {
            log.error('Uncaught Exception detected %s: %s', System.getWorkerId(), IS_SHUTTING_DOWN ? 'but is already shutting down' : '', err.stack);
            if (!IS_SHUTTING_DOWN) {
                System.shutdown(killProcess);
            }
        });
    }
}

module.exports = System;
