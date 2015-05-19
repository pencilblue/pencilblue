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

module.exports = function BaseAdminControllerModule(pb) {
  "use strict";

  var util = pb.util;
  var BaseController = pb.BaseController;

  /**
   * This class serves as a base class for all the controllers used in the admin control panel
   * @constructor
   */
  function BaseAdminController() {
  }
  util.inherits(BaseAdminController, BaseController);

  BaseAdminController.prototype.init = function (props, cb) {
    var self = this;
    BaseController.prototype.init.call(self, props, function () {
      self.pathSiteUId = pb.SiteService.getCurrentSite(self.pathVars.siteid);
      var siteService = new pb.SiteService();
      siteService.getByUid(self.pathSiteUId, function (err, siteInfo) {
        if (err || !siteInfo) {
          self.reqHandler.serve404();
        } else {
          self.sectionService = new pb.SectionService(self.pathSiteUId, true);
          self.sitePrefix = pb.SiteService.getCurrentSitePrefix(self.pathSiteUId);
          self.siteQueryService = new pb.SiteQueryService(self.pathSiteUId, true);
          self.settings = pb.SettingServiceFactory.getServiceBySite(self.pathSiteUId, true);
          self.siteObj = siteInfo;
          self.isGlobalSite = pb.SiteService.isGlobal(siteInfo.uid);
          self.siteName = self.isGlobalSite ? siteInfo.uid : siteInfo.displayName;
          cb();
        }
      })
    });
  };

  return BaseAdminController;
};