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

  /**
   * Initializes the admin controller with site-related info
   * @override
   * @param props
   * @param cb
   */
  BaseAdminController.prototype.init = function (props, cb) {
    var self = this;
    self.pathSiteUId = props.site;
    BaseController.prototype.init.call(self, props, function () {
      self.extendedInit(cb);
    });
  };

  BaseAdminController.prototype.extendedInit = function(cb) {
    var self = this;
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
    });
  };

  /**
   * Retrieves a context object that contains the necessary information for
   * service prototypes
   * @method getServiceContext
   * @return {Object}
   */
  BaseAdminController.prototype.getServiceContext = function(){
    return util.merge(BaseAdminController.super_.prototype.getServiceContext.apply(this), { onlyThisSite: true});
  };

    /**
     * @method getTemplateService
     * @return {Object} TemplateService
     */
    BaseAdminController.prototype.getTemplateService = function(tsOpts) {
        tsOpts.site = this.pathSiteUId;
        return new pb.TemplateService(tsOpts);
    };

  /**
   * Centralized place to obtain the pills to be displayed on top of the admin controller
   *
   * @param navKey
   * @param localizationService
   * @param activePill
   * @param data
   */
  BaseAdminController.prototype.getAdminPills = function (navKey, localizationService, activePill, data) {
    var pills = pb.AdminSubnavService.get(navKey, localizationService, activePill, data);
    return pb.AdminSubnavService.addSiteToPills(pills, this.siteName);
  };

  return BaseAdminController;
};