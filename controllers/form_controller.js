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

/**
 * Provides the basic functionality for implementing a controller that
 * needs access to a posted form.
 */


//dependencies
var BaseController = pb.BaseController;

function FormController(){};

//inheritance
util.inherits(FormController, BaseController);

FormController.prototype.autoSanitize = true;

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

FormController.prototype.getAutoSanitize = function() {
    return this.autoSanitize;
};

FormController.prototype.setAutoSanitize = function(val) {
    this.autoSanitize = val ? true : false;
};

FormController.prototype.onPostParamsError = function(err, cb) {
	pb.log.silly("FormController: Error processing form parameters"+err);
	cb({content: err, code: 400});
};

FormController.prototype.onPostParamsRetrieved = function(params, cb) {
	cb({content: JSON.stringify(params), content_type:'application/json'});
};

//exports
module.exports.FormController = FormController;
