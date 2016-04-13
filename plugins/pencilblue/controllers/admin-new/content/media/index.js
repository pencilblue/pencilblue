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

module.exports = function AdminMediaControllerModule(pb) {

  //pb dependencies
  var util            = pb.util;
  var SecurityService = pb.SecurityService;

  /**
   * Interface for the admin dashboard
   * @class AdminMediaController
   * @constructor
   */
  function AdminMediaController(){}
  util.inherits(AdminMediaController, pb.BaseAdminController);

  /**
   *
   * @method onSiteValidated
   * @param site
   * @param cb
   *
   */
  AdminMediaController.prototype.render = function (cb) {
    this.setPageName(this.localizationService.get('MEDIA'));
    this.ts.load('admin-new/content/media/index', function(error, result) {
      cb({content: result});
    });
  };

  AdminMediaController.getSubNavItems = function(key, ls, data) {
    return [{
      name: 'new_media',
      title: '',
      icon: 'plus',
      href: '/admin/content/media/new'
    }];
  };

  //register admin sub-nav
  pb.AdminSubnavService.registerFor('manage_media', AdminMediaController.getSubNavItems);

  //exports
  return AdminMediaController;
};
