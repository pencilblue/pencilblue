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

module.exports = function(/*pb*/) {
    
    /**
     * Provides function to construct the structure needed to display the navigation
     * in the Admin section of the application.
     *
     * @class BaseBodyParser
     * @constructor
     */
    function BaseBodyParser() {}
    
    /**
     * The prefix in the content-type header that indicates the charset used in 
     * the encoding
     * @static
     * @private
     * @readonly
     * @property CHARSET_HEADER_PREFIX
     * @type {String}
     */
    var CHARSET_HEADER_PREFIX = 'charset=';
    
    /**
     * A mapping that converts the HTTP standard for content-type encoding and 
     * what the Buffer prototype expects
     * @static
     * @private
     * @readonly
     * @property ENCODING_MAPPING
     * @type {Object}
     */
    var ENCODING_MAPPING = Object.freeze({
        'UTF-8': 'utf8',
        'US-ASCII': 'ascii',
        'UTF-16LE': 'utf16le'
    });

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
        var buffers     = [];
        var totalLength = 0;
        
        req.on('data', function (data) {
            buffers.push(data);
            totalLength += data.length;
            
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (totalLength > 1e6) {
                // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
                
                var error = new Error("POST limit reached! Maximum of 1MB.");
                error.code = 400;
                cb(error);
            }
        });
        req.on('end', function () {
            
            //create one big buffer.
            var body = Buffer.concat (buffers, totalLength);
            cb(null, body);
        });
        req.once('error', cb);
    };
    
    /**
     * Attempts to extract charset attribute from the content-type header.
     * @static
     * @method getcontentEncoding
     * @param {Request} req
     * @return {String} the charset encoding
     */
    BaseBodyParser.getContentEncoding = function(req) {
        var rawContentEncoding = req.headers['content-type'];
        if (!util.isString(rawContentEncoding)) {
            return null;
        }
        
        //find the charset in the header
        var index = rawContentEncoding.indexOf(CHARSET_HEADER_PREFIX);
        if (index < 0) {
            return null;
        }
        
        //parse it out and look it up.  Default to UTF-8 if unrecognized
        return rawContentEncoding.substring(index + CHARSET_HEADER_PREFIX.length);
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
            util.forEach(files, function(val, key) {
                fields[key] = val;
            });
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
        var self = this;
        
        this.getRawData(req, function(err, raw){
            if (util.isError(err)) {
                return cb(err);
            }
            
            //lookup encoding
            var encoding = BaseBodyParser.getContentEncoding(req);
            encoding = ENCODING_MAPPING[encoding] ? ENCODING_MAPPING[encoding] : 'utf8';

            var error      = null;
            var postParams = null;
            try {
                postParams = JSON.parse(raw.toString(encoding));
            }
            catch(err) {
                error = err;
            }
            cb(error, postParams);
        });
    };
    
    return {
        BaseBodyParser: BaseBodyParser,
        FormBodyParser: FormBodyParser,
        JsonBodyParser: JsonBodyParser
    };
};
