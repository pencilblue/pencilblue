/*
    Copyright (C) 2017  PencilBlue, LLC

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
const _ = require('lodash');
const ErrorUtils = require('../../include/error/error_utils');
const FormBodyParser = require('../../include/http/parsers').FormBodyParser;
const JsonBodyParser = require('../../include/http/parsers').JsonBodyParser;
const log = require('../../include/utils/logging').newInstance('BodyParserService');
const ValidationService = require('../../include/validation/validation_service');

/**
 * @private
 * @type {object}
 */
var registeredParsers = {
    'application/json': JsonBodyParser,
    'application/x-www-form-urlencoded': FormBodyParser,
    'multipart/form-data': FormBodyParser
};

/**
 *
 */
class BodyParserService {

    /**
     * Parses the incoming request body when the body type specified matches one of
     * those explicitly allowed by the rotue.
     * @param {Request} req
     * @param {Array} mimes An array of allowed MIME strings.
     * @param {Function} cb A callback that takes 2 parameters: An Error, if
     * occurred and the parsed body.  The parsed value is often an object but the
     * value is dependent on the parser selected by the content type.
     */
    static parse (req, mimes, cb) {

        //verify that the content type is acceptable
        var contentType = this.req.headers['content-type'];
        if (contentType) {

            //we split on ';' to check for multipart encoding since it specifies a
            //boundary
            contentType = contentType.split(';')[0];
            if (!!mimes && mimes.indexOf(contentType) === -1) {
                //a type was specified but its not accepted by the controller
                return cb(ErrorUtils.unsupportedMediaType(), null);
            }
        }

        //create the parser
        var BodyParser = registeredParsers[contentType];
        if (!BodyParser) {
            log.silly('RequestHandler: no handler was found to parse the body type [%s]', contentType);
            return cb(ErrorUtils.unsupportedMediaType(), null);
        }

        //initialize the parser and parse content
        var parser = new BodyParser();
        parser.parse(req, cb);
    }

    /**
     * Registers a body parser prototype for the specified mime
     * @static
     * @method registerBodyParser
     * @param {String} mime A non empty string representing the mime type that the prototype can parse
     * @param {Function} prototype A prototype that can have an instance created and parse the specified mime type
     * @return {Boolean} TRUE if the body parser was registered, FALSE if not
     */
    static registerBodyParser (mime, prototype) {
        if (!ValidationService.isNonEmptyStr(mime, true) || !_.isFunction(prototype)) {
            return false;
        }

        //set the prototype handler
        registeredParsers[mime] = prototype;
        return true;
    }

    /**
     * Retrieves the body parser mapping
     * @static
     * @method getBodyParsers
     * @return {Object} MIME string as the key and parser as the value
     */
    static getBodyParsers () {
        return Object.assign({}, registeredParsers);
    }
}

module.exports = BodyParserService;
