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
  class AdminTopicsController {
    init(props, cb) {
      var self = this;
      pb.BaseController.prototype.init.call(self, props, function () {
        self.siteQueryService = new pb.SiteQueryService({site: self.site});
        cb();
      });
    }

    manageTopics(cb) {
      var self = this;

      self.setPageName(self.ls.g('topics.MANAGE_TOPICS'));
      self.ts.registerLocal('active_nav_items', 'content,topics');
      self.ts.load('admin-new/content/topics', function(err, result) {
        cb({content: result});
      });
    }

    newTopic(cb) {
      var self = this;

      self.setPageName(self.ls.g('topics.NEW_TOPIC'));
      self.ts.registerLocal('item_id', '');
      self.ts.registerLocal('active_nav_items', 'content,topics');
      self.ts.load('admin-new/content/topic_form', function(err, result) {
        cb({content: result});
      });
    }

    editTopic(cb) {
      var self = this;

      self.setPageName(self.ls.g('topics.NEW_TOPIC'));
      self.ts.registerLocal('item_id', this.pathVars.id);
      self.ts.registerLocal('active_nav_items', 'content,topics');
      self.ts.load('admin-new/content/topic_form', function(err, result) {
        cb({content: result});
      });
    }
  }

  AdminTopicsController.getRoutes = function(cb) {
    var routes = [{
      method: 'GET',
      path: '/admin-new/content/topics',
      auth_required: true,
      access_level: pb.SecurityService.ACCESS_USER,
      localization: true,
      handler: 'manageTopics'
    }, {
      method: 'GET',
      path: '/admin-new/content/topics/new',
      auth_required: true,
      access_level: pb.SecurityService.ACCESS_USER,
      localization: true,
      handler: 'newTopic'
    }, {
      method: 'GET',
      path: '/admin-new/content/topics/:id',
      auth_required: true,
      access_level: pb.SecurityService.ACCESS_USER,
      localization: true,
      handler: 'editTopic'
    }];

    cb(null, routes);
  };

  pb.util.inherits(AdminTopicsController, pb.BaseController);

  return AdminTopicsController;
}
