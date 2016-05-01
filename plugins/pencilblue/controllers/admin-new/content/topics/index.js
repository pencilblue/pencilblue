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

module.exports = function AdminTopicsControllerModule(pb) {

  //pb dependencies
  var util            = pb.util;
  var SecurityService = pb.SecurityService;

  /**
   * Interface for the admin dashboard
   * @class AdminTopicsController
   * @constructor
   */
  function AdminTopicsController(){}
  util.inherits(AdminTopicsController, pb.BaseAdminController);

  /**
   *
   * @method onSiteValidated
   * @param site
   * @param cb
   *
   */
  AdminTopicsController.prototype.render = function (cb) {
    this.setPageName(this.localizationService.get('TOPICS'));
    this.ts.load('admin-new/content/topics/index', function(error, result) {
      cb({content: result});
    });
  };

  AdminTopicsController.getSubNavItems = function(key, ls, data) {
      return [{
          name: 'new_topic',
          title: ls.get('NEW_TOPIC'),
          icon: 'plus',
          href: '/admin/content/topics/new'
      }, {
          name: 'import_topics',
          title: ls.get('IMPORT_TOPICS'),
          icon: 'upload',
          href: '/admin/content/topics/import'
      }, ];
  };

  //register admin sub-nav
  pb.AdminSubnavService.registerFor('manage_topics', AdminTopicsController.getSubNavItems);

  //exports
  return AdminTopicsController;
};
