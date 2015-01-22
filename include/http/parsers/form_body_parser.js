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
var formidable = require('formidable');

/**
 * Parser for incoming form bodies.  The parser handles 
 * application/x-www-form-urlencoded and multipart/form-data encoded data. Any 
 * uploaded files are stored locally and a descriptor object is passed as the 
 * parsed result.
 *
 * @class FormBodyParser
 * @constructor
 * @extends BaseBodyParser
 */
function FormBodyParser() {}

//inheritance
util.inherits(FormBodyParser, pb.BaseBodyParser);

/**
 * Attempts to parse the request body as multi-part or form/url encoded content
 * @method parse
 * @param {Request} The incoming request whose payload should be parsed
 * @param {Function} A callback that taks two parameters: An Error, if occurred 
 * and the parsed body content as an object
 */
FormBodyParser.prototype.parse = function(req, cb) {
    var form = new formidable.IncomingForm();

    //parse the form out and let us know when its done
    form.parse(req, function(err, fields, files) {
        for(var key in files) {
            fields[key] = files[key];
        }
        cb(err, fields);
    });
};

//exports
module.exports = FormBodyParser;
