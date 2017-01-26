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
  /**
   * Controller for articles pages of the admin section.
   * @constructor
   */
  class AdminArticlesController {
    /**
     * Initializes the controller with PencilBlue properties.
     *
     * @param  {Object}   props The properties object.
     * @param  {Function} [cb]  The callback function for when initialization is complete.
     */
    init(props, cb) {
      var self = this;
      pb.BaseController.prototype.init.call(self, props, function () {
        self.siteQueryService = new pb.SiteQueryService({site: self.site});
        cb();
      });
    }

    /**
     * Loads the Manage Articles page.
     *
     * @param  {Function} [cb]  The callback function for when loading is complete.
     */
    manageArticles(cb) {
      var self = this;

      self.setPageName(self.ls.g('articles.MANAGE_ARTICLES'));
      self.ts.registerLocal('active_nav_items', 'content,articles');
      self.ts.load('admin-new/content/articles', function(err, result) {
        cb({content: result});
      });
    }

    /**
     * Loads the New Article page.
     *
     * @param  {Function} [cb]  The callback function for when loading is complete.
     */
    newArticle(cb) {
      var self = this;

      self.setPageName(self.ls.g('articles.NEW_ARTICLE'));
      self.ts.registerLocal('item_id', '');
      self.ts.registerLocal('active_nav_items', 'content,articles');
      self.ts.load('admin-new/content/article_form', function(err, result) {
        cb({content: result});
      });
    }

    /**
     * Loads the Edit Article page.
     *
     * @param  {Function} [cb]  The callback function for when loading is complete.
     */
    editArticle(cb) {
      var self = this;

      self.setPageName(self.ls.g('articles.NEW_ARTICLE'));
      self.ts.registerLocal('item_id', this.pathVars.id);
      self.ts.registerLocal('active_nav_items', 'content,articles');
      self.ts.load('admin-new/content/article_form', function(err, result) {
        cb({content: result});
      });
    }
  }

  AdminArticlesController.getRoutes = function(cb) {
    var routes = [{
      method: 'GET',
      path: '/admin-new/content/articles',
      auth_required: true,
      access_level: pb.SecurityService.ACCESS_USER,
      localization: true,
      handler: 'manageArticles'
    }, {
      method: 'GET',
      path: '/admin-new/content/articles/new',
      auth_required: true,
      access_level: pb.SecurityService.ACCESS_USER,
      localization: true,
      handler: 'newArticle'
    }, {
      method: 'GET',
      path: '/admin-new/content/articles/:id',
      auth_required: true,
      access_level: pb.SecurityService.ACCESS_USER,
      localization: true,
      handler: 'editArticle'
    }];

    cb(null, routes);
  };

  pb.util.inherits(AdminArticlesController, pb.BaseController);

  return AdminArticlesController;
}
