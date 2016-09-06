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
var path = require('path');

module.exports = function NotFoundControllerModule(pb) {

    //pb dependencies
    var util    = pb.util;
    var TopMenu = pb.TopMenuService;

    /**
     * 404 error
     * @class NotFoundController
     * @constructor
     * @extends BaseController
     */
    function NotFoundController(){}
    util.inherits(NotFoundController, pb.ErrorViewController);

    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    NotFoundController.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err, result) {

            //force the page name & status
            self.status = 404;
            self.setPageName(self.ls.g('error.PAGE_NOT_FOUND'));

            //carry on
            cb(err, result);
        };
        NotFoundController.super_.prototype.init.apply(this, [context, init]);
    };

    /**
     * @method getErrorMessage
     * @return {String}
     */
    NotFoundController.prototype.getErrorMessage = function() {
        return this.ls.g('error.PAGE_NOT_FOUND');
    };

    /*
     * @method getTemplatePath
     * @return {String}
     */
    NotFoundController.prototype.getTemplatePath = function() {
        return 'error/404';
    };

    //exports
    return NotFoundController;
};
