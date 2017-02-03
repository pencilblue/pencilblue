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

//dependencies
const _ = require('lodash');
const Configuration = require('../../config');
const formidable = require('formidable');

/**
 * Provides function to construct the structure needed to display the navigation
 * in the Admin section of the application.
 *
 * @class BaseBodyParser
 * @constructor
 */
class BaseBodyParser {

    /**
     * The prefix in the content-type header that indicates the charset used in
     * the encoding
     * @readonly
     * @type {String}
     */
    static get CHARSET_HEADER_PREFIX() {
        return 'charset=';
    }

    /**
     * A mapping that converts the HTTP standard for content-type encoding and
     * what the Buffer prototype expects
     * @readonly
     * @type {Object}
     */
    static get ENCODING_MAPPING() {
        return Object.freeze({
            'UTF-8': 'utf8',
            'US-ASCII': 'ascii',
            'UTF-16LE': 'utf16le'
        });
    }

    /**
     * Attempts to retrieve the payload body as a string
     * @param {Request} req The incoming request whose payload should be parsed
     * @param {Function} cb A callback that taks two parameters: An Error, if occurred
     * and the parsed body content as an object
     */
    parse(req, cb) {
        this.getRawData(req, cb);
    }

    /**
     * Retrieves the raw payload data as a string
     * @param {Request} req
     * @param {Function} cb
     */
    getRawData(req, cb) {
        var buffers = [];
        var totalLength = 0;

        req.on('data', function (data) {
            buffers.push(data);
            totalLength += data.length;

            if (totalLength > Configuration.active.media.max_upload_size) {
                // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST

                var error = new Error('POST limit reached! Maximum of ' + (Configuration.active.media.max_upload_size / 1000000) + 'MB');
                error.code = 400;
                cb(error);
            }
        });
        req.on('end', function () {

            //create one big buffer.
            var body = Buffer.concat(buffers, totalLength);
            cb(null, body);
        });
        req.once('error', cb);
    }

    /**
     * Attempts to extract charset attribute from the content-type header.
     * @param {Request} req
     * @return {String} the charset encoding
     */
    static getContentEncoding(req) {
        var rawContentEncoding = req.headers['content-type'];
        if (!_.isString(rawContentEncoding)) {
            return null;
        }

        //find the charset in the header
        var index = rawContentEncoding.indexOf(BaseBodyParser.CHARSET_HEADER_PREFIX);
        if (index < 0) {
            return null;
        }

        //parse it out and look it up.  Default to UTF-8 if unrecognized
        return rawContentEncoding.substring(index + BaseBodyParser.CHARSET_HEADER_PREFIX.length);
    }
}

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
class FormBodyParser extends BaseBodyParser {

    /**
     * Attempts to parse the request body as multi-part or form/url encoded content
     * @method parse
     * @param {Request} req The incoming request whose payload should be parsed
     * @param {Function} cb A callback that taks two parameters: An Error, if occurred
     * and the parsed body content as an object
     */
    parse(req, cb) {
        var didError = false;
        var form = new formidable.IncomingForm();
        form.maxFieldSize = Configuration.active.media.max_upload_size;
        form.on('progress', function (bytesReceived, bytesExpected) {
            if ((bytesReceived > Configuration.active.media.max_upload_size || bytesExpected > Configuration.active.max_upload_size) && !didError) {
                didError = true;
                var err = new Error('The request payload is too large');
                err.code = 413;
                this.emit(err);
            }
        });

        //parse the form out and let us know when its done
        form.parse(req, function (err, fields, files) {
            Object.keys(files).forEach(function(key) {
                fields[key] = files[key];
            });
            cb(err, fields);
        });
    }
}

/**
 * Provides function to construct the structure needed to display the navigation
 * in the Admin section of the application.
 *
 * @class JsonBodyParser
 * @constructor
 * @extends BaseBodyParser
 */
class JsonBodyParser extends BaseBodyParser {

    /**
     * Attempts to parse the request body as JSON content
     * @method parse
     * @param {Request} req The incoming request whose payload should be parsed
     * @param {Function} cb A callback that taks two parameters: An Error, if occurred
     * and the parsed body content as an object
     */
    parse(req, cb) {
        var self = this;

        this.getRawData(req, function (err, raw) {
            if (_.isError(err)) {
                return cb(err);
            }

            //lookup encoding
            var encoding = BaseBodyParser.getContentEncoding(req);
            encoding = BaseBodyParser.ENCODING_MAPPING[encoding] ? BaseBodyParser.ENCODING_MAPPING[encoding] : 'utf8';

            var error = null;
            var postParams = null;
            try {
                postParams = JSON.parse(raw.toString(encoding));
            }
            catch (err) {
                error = err;
            }
            cb(error, postParams);
        });
    }
}

module.exports = {
    BaseBodyParser: BaseBodyParser,
    FormBodyParser: FormBodyParser,
    JsonBodyParser: JsonBodyParser
};
