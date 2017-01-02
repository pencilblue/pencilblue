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
const util = require('../include/util.js');

module.exports = function DeleteControllerModule(pb) {
  /**
   * Deletes objects from the database
   * @class DeleteController
   * @constructor
   * @extends FormController
   */
  class DeleteController extends pb.BaseController {

    constructor() {
      super();
      /**
       *
       * @method getRequiredFields
       * @param {Function} cb
       */
      this.getRequiredFields = () => ['id'];

      /**
       *
       * @method canDelete
       * @param {Function} cb
       */
      this.canDelete = (cb) => {
        cb(null, true);
      };

      /**
       *
       * @method onBeforeDelete
       * @param {Function} cb
       */
      this.onBeforeDelete = (cb) => {
        cb(null, true);
      };

      /**
       *
       * @method onAfterDelete
       * @param {Function} cb
       */
      this.onAfterDelete = (cb) => {
        cb(null, true);
      };


      /**
       *
       * @method getFormErrorRedirect
       * @param {Error} err
       * @param {String} message
       * @return
       */
      this.getFormErrorRedirect = (/* err, message */) => '/';

      /**
       *
       * @method getDeleteCollection
       * @return {String}
       */
      this.getDeleteCollection = () => 'IS NOT IMPLEMENTED';
    }
    /**
     *
     * @method onPostParamsRetrieved
     * @param {Function} cb
     */
    onPostParamsRetrieved(post, cb) {
      const get = this.query;

      // merge get and post in case ID was a query string param
      util.merge(get, post);

      // check for the required parameters
      const message = this.hasRequiredParams(post, this.getRequiredFields());
      if (message) {
        this.formError(message, this.getFormErrorRedirect(null, message), cb);
        return;
      }

      // create the tasks & execute in order
      const tasks = [
        (callback) => {
          this.canDelete((err, canDelete) => {
            let error = null;
            if (util.isError(err)) {
              error = err;
            } else if (!canDelete) {
              error = canDelete;
            }
            callback(error, canDelete);
          });
        },
        (callback) => {
          this.onBeforeDelete(callback);
        },
        (callback) => {
          const dao = new pb.DAO();
          dao.delete(this.getDeleteQuery(), this.getDeleteCollection(), callback);
        },
        (callback) => {
          this.onAfterDelete(callback);
        },
      ];
      async.series(tasks, (err, results) => {
        // process the results
        if (err) {
          this.onError(err, null, cb);
        } else {
          cb(this.getDataOnSuccess(results));
        }
      });
    }

    /**
     *
     * @method getDeleteQuery
     * @return {Object}
     */
    getDeleteQuery() {
      return pb.DAO.getIdWhere(this.query.id);
    }

    /**
     *
     * @method
     * @param {Error} [err]
     * @param {String} message
     * @param {Function} cb
     */
    onError(err, message, cb) {
      let msg = message;
      if (util.isNullOrUndefined(msg)) {
        msg = this.getDefaultErrorMessage();
      }
      this.formError(msg, this.getFormErrorRedirect(err, msg), cb);
    }

    /**
     *
     * @method getSuccessRedirect
     * @return {String}
     */
    getSuccessRedirect() {
      return pb.UrlService.createSystemUrl('/', { hostname: this.hostname });
    }

    /**
     *
     * @method getDataOnSuccess
     * @param {Array} results
     * @return {object}
     */
    getDataOnSuccess(/* results */) {
      return pb.RequestHandler.generateRedirect(this.getSuccessRedirect());
    }

    /**
     *
     * @method getDefaultErrorMessage
     * @return {String}
     */
    getDefaultErrorMessage() {
      return this.ls.g('generic.ERROR_SAVING');
    }
  }
  return DeleteController;
};
