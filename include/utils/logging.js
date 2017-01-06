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
var cluster = require('cluster');
var winston = require('winston');
var FsExtra = require('fs-extra');
var Configuration = require('../config');

class LogFactory {

    static createWorkerLabel (label) {
        var workerId = cluster.worker ? cluster.worker.id : 'M';
        return workerId + ':' + (!!label ? label : '');
    }

    static getTransports (label, level, filePath) {
        //initialize transports with console by default
        label = LogFactory.createWorkerLabel(label);
        var consoleOpts = { level: level, timestamp: true, label: label };
        var transports = [
            new winston.transports.Console(consoleOpts)
        ];

        //when a log file path is provided log to a file
        if (typeof filePath === 'string') {

            //ensure the directory structure exists
            FsExtra.ensureFileSync(filePath);

            //add the transport
            var fileOpts = { filename: filePath, level: level, timestamp: true, label: label };
            var fileTransport = new winston.transports.File(fileOpts);
            transports.push(fileTransport);
        }
        return transports;
    }

    static newInstance (label, options) {

        //ensure we have defaults
        options = options || Configuration.active.logging;
        options.level = options.level || 'info';

        if (!Array.isArray(options.transports)) {

            //initialize transports with console by default
            options.transports = LogFactory.getTransports(label, options.level, options.file);
        }

        //configure winston
        var logger =  new winston.Logger({
            transports: options.transports,
            level: options.level,
            padLevels: false
        });

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

        return logger;
    }
}

module.exports = LogFactory;
