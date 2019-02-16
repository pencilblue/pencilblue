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

module.exports = function ServerErrorControllerModule(pb) {

  //pb dependencies
  var util    = pb.util;
  var TopMenu = pb.TopMenuService;

  /**
   * 500 error
   * @class NotFoundController
   * @constructor
   * @extends BaseController
   */
  function ServerErrorController() {
  }

  /**
   * Initializes the controller
   * @method initSync
   * @param {Object} context
   */
  ServerErrorController.prototype.initSync = function(params) {
    this.mime         = this.mime || params.mime;
    this.error        = this.error  || params.error;
    this.request      = params.request;
    this.localization = params.localization_service;
  };

  util.inherits(ServerErrorController, pb.BaseController);

  /**
   * @see BaseController.render
   * @method render
   * @param {Function} cb
   */
  ServerErrorController.prototype.render = function (cb) {
    var self = this;

    var errorCode = self.error && self.error.code ? self.error.code : '500';
    self.ts.registerLocal('ERROR_CODE', errorCode);
    this.setPageName(errorCode);
    var contentService = new pb.ContentService();
    contentService.getSettings(function (err, contentSettings) {
      var options = {
        site: self.site,
        currUrl: self.req.url
      };
      TopMenu.getTopMenu(self.session, self.ls, options, function (themeSettings, navigation, accountButtons) {
        TopMenu.getBootstrapNav(navigation, accountButtons, function (navigation, accountButtons) {

          self.ts.registerLocal('angular_script', pb.ClientJs.getAngularController({}, ['ngAnimate']));

          self.ts.registerLocal('error_message', self.error.message);
          self.ts.registerLocal('stack_trace', self.error.stack);
          //load template
          self.ts.registerLocal('navigation', new pb.TemplateValue(navigation, false));
          self.ts.registerLocal('account_buttons', new pb.TemplateValue(accountButtons, false));
          self.ts.load('error/500', function (err, data) {
            var result = '' + data;

            result = result.concat(pb.ClientJs.getAngularController(
              {
                navigation: navigation,
                contentSettings: contentSettings,
                loggedIn: pb.security.isAuthenticated(self.session),
                accountButtons: accountButtons
              }));

            cb({content: result, code: 500, content_type: 'text/html'});
          });
        });
      });
    });
  };

  //exports
  return ServerErrorController;
};
