/*
    Copyright (C) 2017  PencilBlue, LLC

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

module.exports = function(pb) {
  class AdminIndexController {
    init(props, cb) {
      var self = this;
      pb.BaseController.prototype.init.call(self, props, function () {
        self.siteQueryService = new pb.SiteQueryService({site: self.site});
        cb();
      });
    }

    render(cb) {
      var self = this;

      self.setPageName(self.ls.g('admin.DASHBOARD'));
      self.ts.registerLocal('active_nav_items', 'content,topics');
      self.ts.load('admin-new/index', function(err, result) {
        cb({content: result});
      });
    }
  }

  AdminIndexController.getRoutes = function(cb) {
    var routes = [
      {
        method: 'GET',
        path: '/admin-new',
        auth_required: true,
        access_level: pb.SecurityService.ACCESS_USER,
        localization: true
      }
    ];

    cb(null, routes);
  };

  pb.util.inherits(AdminIndexController, pb.BaseController);

  return AdminIndexController;
}
