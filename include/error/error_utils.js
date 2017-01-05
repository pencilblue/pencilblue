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
var HttpStatusCodes = require('http-status-codes');

/**
 * Provides convenience functions to create errors for specific conditions
 * @class ErrorUtils
 */
class ErrorUtils {

    /**
     * Creates an error that represents when a resource is not found (404)
     * @static
     * @method notFound
     * @param {string} [message]
     * @returns {Error}
     */
    static notFound (message) {
        return ErrorUtils.custom(message, HttpStatusCodes.NOT_FOUND);
    }

    /**
     * Creates an error that represents a lack of permission (403)
     * @static
     * @method forbidden
     * @param {string} [message]
     * @returns {Error}
     */
    static forbidden (message) {
        return ErrorUtils.custom(message, HttpStatusCodes.FORBIDDEN);
    }

    /**
     * Creates an error that represents an unauthorized request (401)
     * @static
     * @method notAuthorized
     * @param {string} [message]
     * @returns {Error}
     */
    static notAuthorized (message) {
        return ErrorUtils.custom(message, HttpStatusCodes.UNAUTHORIZED);
    }

    /**
     * Creates an error that represents an internal server error
     * @static
     * @method badRequest
     * @param {object} [options]
     * @param {string} [options.message]
     * @param {Array} [options.validationErrors]
     * @returns {Error}
     */
    static badRequest (options) {
        options = options || {};
        var err =  ErrorUtils.custom(options.message, HttpStatusCodes.BAD_REQUEST);
        err.validationErrors = options.validationErrors;
        return err;
    }

    /**
     * Creates an error that represents an internal server error (500)
     * @static
     * @method internalServerError
     * @param {string} [message]
     * @returns {Error}
     */
    static internalServerError (message) {
        return ErrorUtils.custom(message);
    }

    /**
     * Creates a custom error with a specific message and status code
     * @static
     * @method custom
     * @param {string} [message='An Error Occurred']
     * @param {Number} [code=500]
     * @return {Error}
     */
    static custom (message, code) {
        code = code || HttpStatusCodes.INTERNAL_SERVER_ERROR;
        var err = new Error(message || HttpStatusCodes.getStatusText(code) || 'An Error Occurred');
        err.code = code;
        return err;
    }
}

module.exports = ErrorUtils;
