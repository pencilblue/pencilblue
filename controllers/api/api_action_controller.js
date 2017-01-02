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

// dependencies
const async = require('async');
const util = require('../../include/util.js');

module.exports = function ApiActionControllerModule(pb) {
  // pb dependencies
  const BaseController = pb.BaseController;

  /**
   * Controller interface used to map simple actions to handlers and provide
   * a flow for validation and error handling.
   * @deprecated Since 0.4.1
   * @class ApiActionController
   * @constructor
   * @extends BaseController
   */
  class ApiActionController extends BaseController {

    constructor() {
      super();
      /**
       * Flag to indicate if the form should automatically sanitize the incoming
       * values.  In this case sanitize means it will attempt to strip away any
       * HTML tags to prevent HTML injection and XSS.
       * @property autoSanitize
       * @type {Boolean}
       */
      this.autoSanitize = true;

      /**
       * Provides the hash of all actions supported by this controller
       * @method getActions
       * @return {Object} An empty hash of actions since this is meant to be
       * overriden.
       */
      this.getActions = () => {};

      /**
       * Validates any query parameters for the specified action.  The callback will
       * provide an array of validation errors. When the array is empty it is safe to
       * assume that validation succeeded. The default implementation passes an empty
       * error array.
       * @method validateQueryParameters
       * @param {String} action
       * @param {Function} cb
       */
      this.validateQueryParameters = (action, cb) => {
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
      this.validatePostParameters = (action, post, cb) => {
        cb(null, []);
      };
    }

    /**
     * The entry point called by the RequestHandler.  Executes the calls to the
     * validation framework then, if passes, executes the action handler.
     * @method render
     * @param {Function} cb
     */
    render(cb) {
      // validate action
      const action = this.pathVars.action;
      this.validateParameters(action, (err, errors) => {
        const isError = util.isError(err);
        // check for errors
        if (isError || errors.length > 0) {
          const content = BaseController.apiResponse(BaseController.API_FAILURE, '', errors);
          cb({ content, code: isError ? 500 : 400 });
          return;
        }

        // route to handler
        this[action](cb);
      });
    }

    /**
     * Validates the query, path, and post parameters in parallel and calls back
     * with any validation errors.
     * @method validateParameters
     * @param {String} action
     * @param {Function} cb
     */
    validateParameters(action, cb) {
      const actions = this.getActions();
      if (!pb.validation.validateNonEmptyStr(action, true) || actions[action] === undefined) {
        return cb(null, [this.ls.g('generic.VALID_ACTION_REQUIRED')]);
      }

      const tasks = [
        (callback) => {
          this.validatePathParameters(action, callback);
        },
        (callback) => {
          this.validateQueryParameters(action, callback);
        },
        (callback) => {
          if (this.req.method.toUpperCase() !== 'POST') {
            return callback(null, []);
          }
          return this.getPostParams((err, post) => {
            if (util.isError(err)) {
              return callback(err, []);
            }

            if (this.getAutoSanitize()) {
              this.sanitizeObject(post);
            }

            this.post = post;
            return this.validatePostParameters(action, post, callback);
          });
        },
      ];
      return async.parallel(tasks, (err, results) => {
        const errors = [];
        if (util.isArray(results)) {
          for (let i = 0; i < results.length; i += 1) {
            if (util.isArray(results[i])) {
              util.arrayPushAll(results[i], errors);
            }
          }
        }
        cb(err, errors);
      });
    }

    /**
     * @method getAutoSanitize
     * @return {Boolean
     */
    getAutoSanitize() {
      return this.autoSanitize;
    }

    /**
     * @method setAutoSanitize
     * @param {Boolean} val
     */
    setAutoSanitize(val) {
      this.autoSanitize = !!val;
    }

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
    validatePathParameters(action, cb) {
      // validate identifier
      const errors = [];
      const actions = this.getActions();
      if (actions[action] && !pb.validation.validateNonEmptyStr(this.pathVars.id, true)) {
        errors.push(this.ls.g('generic.VALID_IDENTIFIER_REQUIRED'));
      }
      cb(null, errors);
    }

  }
  return ApiActionController;
};
