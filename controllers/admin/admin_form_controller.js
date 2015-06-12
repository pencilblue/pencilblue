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

module.exports = function AdminFormControllerModule(pb) {
  "use strict";

  var util = pb.util;
  var BaseAdminController = pb.BaseAdminController;

  function AdminFormController() {
  }
  util.inherits(AdminFormController, pb.FormController);

  /**
   * @override
   * @param props
   * @param cb
   */
  AdminFormController.prototype.init = function (props, cb) {
    var self = this;
    self.site = pb.SiteService.getCurrentSite(props.site);
    pb.FormController.prototype.init.call(self, props, function () {
      BaseAdminController.prototype.extendedInit.call(self, cb);
    });
  };

  AdminFormController.prototype.getAdminPills = BaseAdminController.prototype.getAdminPills;

  return AdminFormController;
};