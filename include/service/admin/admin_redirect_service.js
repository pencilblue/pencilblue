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

module.exports = function AdminRedirectServiceModule(pb) {
  "use strict";

  function AdminRedirectService() {
  }

  /**
   * Redirect admin user after logging in
   *
   * @param controller
 * @param user
   * @param cb
   */
  AdminRedirectService.redirectAdminUser = function (controller, user, cb) {
    var location = '/admin';
    var site = pb.SiteService.getSiteFromObject(user);
    if (!pb.SiteService.areEqual(site, controller.site)) {
      var siteId = pb.SiteService.getCurrentSite(site);
      location += pb.SiteService.getCurrentSitePrefix(siteId);
      if (pb.SiteService.isGlobal(siteId)) {
        controller.redirect(pb.config.siteRoot + location, cb);
      } else {
        var service = new pb.SiteService();
        service.getByUid(siteId, function (siteObj) {
          if (siteObj) {
            location = siteObj.hostname + location;
          }
          controller.redirect(location, cb);
        });
      }
    } else {
      controller.redirect(location, cb);
    }
  };

  return AdminRedirectService;
};