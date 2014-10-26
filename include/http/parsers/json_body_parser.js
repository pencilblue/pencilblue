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
 * @extends BaseBodyParser
 */
function JsonBodyParser() {}

//inheritance
util.inherits(JsonBodyParser, pb.BaseBodyParser);

/**
 * Attempts to parse the request body as JSON content
 * @method parse
 * @param {Request} The incoming request whose payload should be parsed
 * @param {Function} A callback that taks two parameters: An Error, if occurred 
 * and the parsed body content as an object
 */
JsonBodyParser.prototype.parse = function(req, cb) {
    this.getRawData(req, function(err, raw){
		if (util.isError(err)) {
			return cb(err);
		}

        //parse the content
        try {
            cb(null, JSON.parse(raw));
        }
        catch(err) {
            cb(err);
        }
	});
};

//exports
module.exports = JsonBodyParser;
