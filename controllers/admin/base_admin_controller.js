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
   * @class BaseAdminController
   * @constructor
   * @extends BaseController
   */
  function BaseAdminController() {}
  util.inherits(BaseAdminController, BaseController);

  /**
   * Initializes the admin controller with site-related info
   * @override
   * @method init
   * @param {Object} props
   * @param {Function} cb
   */
  BaseAdminController.prototype.init = function (props, cb) {
    var self = this;
    BaseController.prototype.init.call(self, props, function () {
      self.extendedInit(cb);
    });
  };

  /**
   * Initializes the admin controller with instance variables
   * @override
   * @method extendedInit
   * @param {Function} cb
   */
  BaseAdminController.prototype.extendedInit = function(cb) {
    this.siteQueryService = new pb.SiteQueryService({site: this.site, onlyThisSite: true});
    this.settings = pb.SettingServiceFactory.getServiceBySite(this.site, true);
    cb();
  };

  /**
   * Centralized place to obtain the pills to be displayed on top of the admin controller
   * @method getAdminPills
   * @param {string} navKey
   * @param {Localization} localizationService
   * @param {*} activePill
   * @param {Object} [data]
   * @return {Object} pill objects for admin console with site pill at the beginning
   */
  BaseAdminController.prototype.getAdminPills = function (navKey, localizationService, activePill, data) {
    var pills = pb.AdminSubnavService.get(navKey, localizationService, activePill, data);
    return pb.AdminSubnavService.addSiteToPills(pills, this.siteName);
  };

  return BaseAdminController;
};
