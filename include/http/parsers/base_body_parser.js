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
 * Provides function to construct the structure needed to display the navigation
 * in the Admin section of the application.
 *
 * @class JsonBodyParser
 * @constructor
 */
function BaseBodyParser() {}

/**
 * Attempts to retrieve the payload body as a string
 * @method parse
 * @param {Request} The incoming request whose payload should be parsed
 * @param {Function} A callback that taks two parameters: An Error, if occurred 
 * and the parsed body content as an object
 */
BaseBodyParser.prototype.parse = function(req, cb) {
    this.getRawData(req, cb);
};

/**
 * Retrieves the raw payload data as a string
 * @method getRawData
 * @param {Function} cb
 */
BaseBodyParser.prototype.getRawData = function(req, cb) {
	var body = '';
    req.on('data', function (data) {
        body += data;
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 2e6) {
            // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
            cb(Error("POST limit reached! Maximum of 2MB."), null);
        }
    });
    req.on('end', function () {
    	cb(null, body);
    });
};

//exports
module.exports = BaseBodyParser;
