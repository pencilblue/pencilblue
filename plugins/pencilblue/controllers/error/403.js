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
var path = require('path');

module.exports = function ForbiddenControllerModule(pb) {

  //pb dependencies
  var util    = pb.util;

  /**
   * 403 error
   * @class ForbiddenController
   * @constructor
   * @extends BaseController
   */
  function ForbiddenController() {
  }

  /**
   * Initializes the controller
   * @method initSync
   * @param {Object} context
   */
  ForbiddenController.prototype.initSync = function(params) {
    this.mime         = this.mime || params.mime;
    this.error        = this.error  || params.error;
    this.request      = params.request;
    this.localization = params.localization_service;
  };

  util.inherits(ForbiddenController, pb.BaseController);

  /**
   * @see BaseController.render
   * @method render
   * @param {Function} cb
   */
  ForbiddenController.prototype.render = function (cb) {
    var self = this;

    var errorCode = self.error && self.error.code ? self.error.code : '403';
    self.ts.registerLocal('ERROR_CODE', errorCode);
    this.setPageName(errorCode);
    self.ts.load('error/403', function (err, data) {
      cb({content: '' + data, code: errorCode, content_type: 'text/html'});
    });
  };

  //exports
  return ForbiddenController;
};
