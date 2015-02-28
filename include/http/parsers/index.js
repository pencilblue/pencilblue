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
var formidable = require('formidable');
var util       = require('../../util.js');

module.exports = function BodyParsersModule(pb) {
    
    /**
     * Provides function to construct the structure needed to display the navigation
     * in the Admin section of the application.
     *
     * @class BaseBodyParser
     * @constructor
     */
    function BaseBodyParser() {};

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
    util.inherits(FormBodyParser, BaseBodyParser);

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
    
    /**
     * Provides function to construct the structure needed to display the navigation
     * in the Admin section of the application.
     *
     * @class JsonBodyParser
     * @constructor
     * @extends BaseBodyParser
     */
    function JsonBodyParser() {}
    util.inherits(JsonBodyParser, BaseBodyParser);

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
    
    return {
        BaseBodyParser: BaseBodyParser,
        FormBodyParser: FormBodyParser,
        JsonBodyParser: JsonBodyParser
    };
};
