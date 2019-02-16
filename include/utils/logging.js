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
'use strict'
//dependencies
const cluster = require('cluster');
const winston = require('winston');
const util    = require('../util.js');
let newrelic = null;

if(process.env.NEW_RELIC_LICENSE_KEY && process.env.NEW_RELIC_APP_NAME){
  newrelic = require('newrelic');
}

function configureFileTransport(config) {
    //when a log file path is provided log to a file
    if (util.isString(config.logging.file)) {

        //ensure the directory structure exists
        util.mkdirsSync(config.logging.file, true, util.cb);

        //add the transport
        var fileTransport = new (winston.transports.File)({ filename: config.logging.file, level: config.logging.level, timestamp: true });
        config.logging.transports.push(fileTransport);
    }
}

function getConsoleTransport(config) {
    return new (winston.transports.Console)({
        level: config.logging.level,
        timestamp: true,
        label: cluster.worker ? cluster.worker.id : 'M'
    });
}

function getLogger(config) {
    return new (winston.Logger)({
        transports: config.logging.transports,
        level: config.logging.level,
        padLevels: false
    })
}

module.exports = function LogFactory(config){
    //verify that we have a valid logging configuration provided
    if (!util.isObject(config.logging)) {
        config.logging = {};
    }
    if (!util.isString(config.logging.level)) {
        config.logging.level = "info";
    }
    if (!util.isArray(config.logging.transports)) {
        //initialize transports with console by default
        config.logging.transports = [getConsoleTransport(config)];
        configureFileTransport(config);
    }

    const logger = getLogger(config);

    /**
     * Determines if the root log level is set to debug or silly
     * @method isDebug
     * @return {Boolean}
     */
    logger.isDebug = function(){
		return logger.levels[logger.level] >= logger.levels.debug;
	};

    /**
     * Determines if the root log level is set to silly
     * @method isSilly
     * @return {Boolean}
     */
    logger.isSilly = function(){
		return logger.levels[logger.level] >= logger.levels.silly;
	};

    logger.setTransactionName = function(routeName) {
          if (newrelic) {
              newrelic.setTransactionName(routeName)
          }
    };

    // wrap log.error to notify newrelic
    let logError = logger.error;
    logger.error = function(msg) {
        if (newrelic) {
            newrelic.noticeError(msg)
        }
        logError.apply(logger, arguments)
    }

    //return the configured logger instance
    logger.info('SystemStartup: Log Level is: '+config.logging.level);
    return logger;
};
