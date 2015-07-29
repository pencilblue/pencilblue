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

//dependencies
var async = require('async');

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;
    var UserService = pb.UserService;

    /**
     * Interface for creating and editing pages
     */
    function PageFormController(){}
    util.inherits(PageFormController, pb.BaseAdminController);

    PageFormController.prototype.render = function(cb) {
        var self  = this;
        var vars = this.pathVars;
        this.vars = vars;

        self.gatherData(vars, function(err, results){
            if(util.isError(err)) {
                throw err;
            }
            else if(!results.page) {
                self.reqHandler.serve404();
                return;
            }

            self.page = results.page;
            if(!self.page.author) {
              self.page.author = self.session.authentication.user._id.toString();
            }

            if(self.session.authentication.user.admin >= pb.SecurityService.ACCESS_EDITOR) {
                var userService = new UserService(self.getServiceContext());
                userService.getWriterOrEditorSelectList(self.page.author, true, function(err, availableAuthors) {
                if(availableAuthors && availableAuthors.length > 1) {
                  results.availableAuthors = availableAuthors;
                }
                self.finishRender(results, cb);
              });
              return;
            }

            self.finishRender(results, cb);
        });
    };

    PageFormController.prototype.finishRender = function(results, cb) {
      var self = this;

      var tabs = self.getTabs();

      self.setPageName(self.page[pb.DAO.getIdField()] ? self.page.headline : self.ls.get('NEW_PAGE'));
      self.ts.registerLocal('angular_objects', new pb.TemplateValue(self.getAngularObjects(tabs, results), false));
      self.ts.load('admin/content/pages/page_form', function(err, data) {
          var result = data;
          self.checkForFormRefill(result, function(err, newResult) {
              //Handle errors
              if (util.isError(err)) {
                  pb.log.error("PageFormController.checkForFormRefill encountered an error. ERROR[%s]", err.stack);
                  return cb(err);
              }
              result = newResult;
              cb({content: result});
          });
      });
    };

    /**
     *
     * @method getAngularObjects
     *
     */
    PageFormController.prototype.getAngularObjects = function(tabs, data) {
        var self = this;
        if(data.page[pb.DAO.getIdField()]) {
            var media = [];
            var i, j;

            for(i = 0; i < data.page.page_media.length; i++) {
                for(j = 0; j < data.media.length; j++) {
                    if(pb.DAO.areIdsEqual(data.media[j][pb.DAO.getIdField()], data.page.page_media[i])) {
                        media.push(data.media[j]);
                        data.media.splice(j, 1);
                        break;
                    }
                }
            }
            data.page.page_media = media;

            var topics = [];
            for(i = 0; i < data.page.page_topics.length; i++) {
                for(j = 0; j < data.topics.length; j++) {
                    if(pb.DAO.areIdsEqual(data.topics[j][pb.DAO.getIdField()], data.page.page_topics[i])) {
                        topics.push(data.topics[j]);
                        data.topics.splice(j, 1);
                        break;
                    }
                }
            }
            data.page.page_topics = topics;
        }
        
        var objects = {
            navigation: pb.AdminNavigation.get(this.session, ['content', 'pages'], this.ls, this.site),
            pills: self.getAdminPills(this.getActivePill(), this.ls, this.getActivePill(), data),
            tabs: tabs,
            templates: data.templates,
            sections: data.sections,
            topics: data.topics,
            media: data.media,
            page: data.page,
            siteKey: pb.SiteService.SITE_FIELD,
            site: self.site
        };
        if(data.availableAuthors) {
          objects.availableAuthors = data.availableAuthors;
        }
        return pb.ClientJs.getAngularObjects(objects);
    };

    /**
     * @static
     * @method getAngularObjects
     *
     */
    PageFormController.getSubNavItems = function(key, ls, data) {
        return [{
            name: 'manage_pages',
            title: data.page[pb.DAO.getIdField()] ? ls.get('EDIT') + ' ' + data.page.headline : ls.get('NEW_PAGE'),
            icon: 'chevron-left',
            href: '/admin/content/pages'
        }, {
            name: 'new_page',
            title: '',
            icon: 'plus',
            href: '/admin/content/pages/new'
        }];
    };

    /**
     *
     * @method getActivePill
     *
     */
    PageFormController.prototype.getActivePill = function() {
        return 'new_page';
    };

    /**
     *
     * @method gatherData
     *
     */
    PageFormController.prototype.gatherData = function(vars, cb) {
        var self  = this;
        var tasks = {
            templates: function(callback) {
                callback(null, pb.TemplateService.getAvailableContentTemplates(self.site));
            },

            sections: function(callback) {
                var opts = {
                    select: pb.DAO.PROJECT_ALL,
                    where: {
                        type: {$in: ['container', 'section']}
                    },
                    order: {name: pb.DAO.ASC}
                };
                self.siteQueryService.q('section', opts, callback);
            },

            topics: function(callback) {
                var opts = {
                    select: pb.DAO.PROJECT_ALL,
                    where: pb.DAO.ANYWHERE,
                    order: {name: pb.DAO.ASC}
                };
                self.siteQueryService.q('topic', opts, callback);
            },

            media: function(callback) {
                var mservice = new pb.MediaService(null, self.site, true);
                mservice.get(callback);
            },

            page: function(callback) {
                if(!vars.id) {
                    return callback(null, {});
                }

                self.siteQueryService.loadById(vars.id, 'page', callback);
            }
        };
        async.parallelLimit(tasks, 2, cb);
    };

    /**
     *
     * @method getTabs
     *
     */
    PageFormController.prototype.getTabs = function() {
        return [
            {
                active: 'active',
                href: '#content',
                icon: 'quote-left',
                title: this.ls.get('CONTENT')
            },
            {
                href: '#media',
                icon: 'camera',
                title: this.ls.get('MEDIA')
            },
            {
                href: '#topics_dnd',
                icon: 'tags',
                title: this.ls.get('TOPICS')
            },
            {
                href: '#seo',
                icon: 'tasks',
                title: this.ls.get('SEO')
            }
        ];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor('new_page', PageFormController.getSubNavItems);

    //exports
    return PageFormController;
};
