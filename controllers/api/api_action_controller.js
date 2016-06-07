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
var async = require('async');
var util  = require('../../include/util.js');

module.exports = function ApiActionControllerModule(pb) {

    //pb dependencies
    var BaseController = pb.BaseController;

    /**
     * Controller interface used to map simple actions to handlers and provide
     * a flow for validation and error handling.
     * @deprecated Since 0.4.1
     * @class ApiActionController
     * @constructor
     * @extends BaseController
     */
    function ApiActionController(){}
    util.inherits(ApiActionController, BaseController);

    /**
     * Flag to indicate if the form should automatically sanitize the incoming
     * values.  In this case sanitize means it will attempt to strip away any
     * HTML tags to prevent HTML injection and XSS.
     * @property autoSanitize
     * @type {Boolean}
     */
    ApiActionController.prototype.autoSanitize = true;

    /**
     * The entry point called by the RequestHandler.  Executes the calls to the
     * validation framework then, if passes, executes the action handler.
     * @method render
     * @param {Function} cb
     */
    ApiActionController.prototype.render = function(cb) {

        //validate action
        var self   = this;
        var action = this.pathVars.action;
        this.validateParameters(action, function(err, errors) {
            var isError = util.isError(err);
            //check for errors
            if (isError || errors.length > 0) {
                var content = BaseController.apiResponse(BaseController.API_FAILURE, '', errors);
                cb({content: content, code: isError ? 500 : 400});
                return;
            }

            //route to handler
            self[action](cb);
        });
    };

    /**
     * Provides the hash of all actions supported by this controller
     * @method getActions
     * @return {Object} An empty hash of actions since this is meant to be
     * overriden.
     */
    ApiActionController.prototype.getActions = function() {
        return {};
    };

    /**
     * Validates the query, path, and post parameters in parallel and calls back
     * with any validation errors.
     * @method validateParameters
     * @param {String} action
     * @param {Function} cb
     */
    ApiActionController.prototype.validateParameters = function(action, cb) {

        var actions = this.getActions();
        if (!pb.validation.validateNonEmptyStr(action, true) || actions[action] === undefined) {
            return cb(null, [this.ls.g('generic.VALID_ACTION_REQUIRED')]);
        }

        var self = this;
        var tasks = [
            function(callback) {
                self.validatePathParameters(action, callback);
            },
            function(callback) {
                self.validateQueryParameters(action, callback);
            },
            function(callback) {
                if (self.req.method.toUpperCase() !== 'POST') {
                    return callback(null, []);
                }
                self.getPostParams(function(err, post) {
                    if (util.isError(err)) {
                        return callback(err, []);
                    }

                    if (self.getAutoSanitize()) {
                        self.sanitizeObject(post);
                    }

                    self.post = post;
                    self.validatePostParameters(action, post, callback);
                });
            },
        ];
        async.parallel(tasks, function(err, results) {

            var errors = [];
            if (util.isArray(results)) {
                for (var i = 0; i < results.length; i++) {
                    if (util.isArray(results[i])) {
                        util.arrayPushAll(results[i], errors);
                    }
                }
            }
            cb(err, errors);
        });
    };

    /**
     * @method getAutoSanitize
     * @return {Boolean
     */
    ApiActionController.prototype.getAutoSanitize = function() {
        return this.autoSanitize;
    };

    /**
     * @method setAutoSanitize
     * @param {Boolean} val
     */
    ApiActionController.prototype.setAutoSanitize = function(val) {
        this.autoSanitize = val ? true : false;
    };

    /**
     * Validates any path parameters for the specified action.  The callback will
     * provide an array of validation errors. When the array is empty it is safe to
     * assume that validation succeeded. The default implementation examines the
     * value for the action in the value returned by ApiActionController#getActions.
     * If the value evaluates to true then the implementation will validate that an
     * "id" path parameter was passed.
     * @method validatePathParameters
     * @param {String} action
     * @param {Function} cb
     */
    ApiActionController.prototype.validatePathParameters = function(action, cb) {
        //validate identifier
        var errors  = [];
        var actions = this.getActions();
        if (actions[action] && !pb.validation.validateNonEmptyStr(this.pathVars.id, true)) {
            errors.push(this.ls.g('generic.VALID_IDENTIFIER_REQUIRED'));
        }
        cb(null, errors);
    };

    /**
     * Validates any query parameters for the specified action.  The callback will
     * provide an array of validation errors. When the array is empty it is safe to
     * assume that validation succeeded. The default implementation passes an empty
     * error array.
     * @method validateQueryParameters
     * @param {String} action
     * @param {Function} cb
     */
    ApiActionController.prototype.validateQueryParameters = function(action, cb) {
        cb(null, []);
    };

    /**
     * Validates any post parameters for the specified action.  The callback will
     * provide an array of validation errors. When the array is empty it is safe to
     * assume that validation succeeded. The default implementation passes an empty
     * error array.
     * @method validatePostParameters
     * @param {String} action
     * @param {Object} post
     * @param {Function} cb
     */
    ApiActionController.prototype.validatePostParameters = function(action, post, cb) {
        cb(null, []);
    };

    return ApiActionController;
};
