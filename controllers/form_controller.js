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
var util = require('../include/util.js');

module.exports = function(pb) {
    
    /**
     * Provides the basic functionality for implementing a controller that
     * needs access to a posted form.
     * @class FormController
     * @extends BaseController
     * @constructor
     */
    function FormController(){}
    util.inherits(FormController, pb.BaseController);

    /**
     * Instructs the controller to automatically sanitize any incoming post data
     * when set to TRUE.
     * @property autoSanitize
     * @type {Boolean}
     */
    FormController.prototype.autoSanitize = true;

    /**
     * Responsible for gathering the payload data from the request and parsing it.
     * The result is passed down to the controller's onPostParamsRetrieved function.
     * In addition and the <i>autoSanitize</i> property is TRUE, the posted
     * parameters will be sanitized.
     * @see BaseController#render
     * @method render
     * @param {Function} cb
     */
    FormController.prototype.render = function(cb) {
        var self = this;
        this.getPostParams(function(err, params) {
            if (util.isError(err)) {
                self.onPostParamsError(err, cb);
                return;
            }

            if (self.getAutoSanitize()) {
                self.sanitizeObject(params);
            }
            self.onPostParamsRetrieved(params, cb);
        });
    };

    /**
     *
     * @method getAutoSanitize
     * @return {Boolean}
     */
    FormController.prototype.getAutoSanitize = function() {
        return this.autoSanitize;
    };

    /**
     *
     * @method setAutoSanitize
     * @param {Boolean} val
     */
    FormController.prototype.setAutoSanitize = function(val) {
        this.autoSanitize = val ? true : false;
    };

    /**
     *
     * @method onPostParamsError
     * @param {Error} err
     * @param {Function} cb
     */
    FormController.prototype.onPostParamsError = function(err, cb) {
        pb.log.silly("FormController: Error processing form parameters"+err);
        cb({content: err, code: 400});
    };

    /**
     * Called after the posted parameters have been received and parsed.  The
     * function should be overriden in order to continue processing and render the
     * result of the request.  The default implementation echoes the received
     * parameters as JSON.
     * @method onPostParamsRetrieved
     * @param {Object} params
     * @param {Function} cb
     */
    FormController.prototype.onPostParamsRetrieved = function(params, cb) {
        cb({content: JSON.stringify(params), content_type:'application/json'});
    };
    
    return FormController;
};
