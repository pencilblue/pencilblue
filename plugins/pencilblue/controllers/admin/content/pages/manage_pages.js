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

module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    var UserService = pb.UserService;
    
    /**
     * Interface for managing pages
     */
    function ManagePages(){}
    util.inherits(ManagePages, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'manage_pages';

    ManagePages.prototype.render = function(cb) {
        var self = this;

        var opts = {
            select: pb.DAO.PROJECT_ALL,
            where: pb.DAO.ANYWHERE,
            order: {headline: pb.DAO.ASC}
        };
        self.siteQueryService.q('page', opts, function(err, pages) {
            if (util.isError(err)) {
                return self.reqHandler.serveError(err);
            }
            else if(pages.length === 0) {
                return self.redirect('/admin/content/pages/new', cb);
            }

            var userService = new UserService(self.getServiceContext());
            userService.getAuthors(pages, function(err, pagesWithAuthor) {
                self.getAngularObjects(pagesWithAuthor, function(angularObjects) {
                    var title = self.ls.get('MANAGE_PAGES');
                    self.setPageName(title);
                    self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
                    self.ts.load('admin/content/pages/manage_pages', function(err, data) {
                        var result = '' + data;
                        cb({content: result});
                    });
                });
            });
        });
    };

    ManagePages.prototype.getPageStatuses = function(pages) {
        var now = new Date();
        for(var i = 0; i < pages.length; i++) {
            if(pages[i].draft) {
                pages[i].status = this.ls.get('DRAFT');
            }
            else if(pages[i].publish_date > now) {
                pages[i].status = this.ls.get('UNPUBLISHED');
            }
            else {
                pages[i].status = this.ls.get('PUBLISHED');
            }
        }

        return pages;
    };

    ManagePages.prototype.getAngularObjects = function(pagesWithAuthor, cb) {
        var self = this;
        pb.AdminSubnavService.getWithSite(SUB_NAV_KEY, self.ls, 'manage_pages', {site: self.site}, function(pills) {
            var angularObjects = pb.ClientJs.getAngularObjects({
                navigation: pb.AdminNavigation.get(self.session, ['content', 'pages'], self.ls),
                pills: pills,
                pages: self.getPageStatuses(pagesWithAuthor)
            });
            cb(angularObjects);
        });

    };

    ManagePages.getSubNavItems = function(key, ls, data) {
        return [{
            name: 'manage_pages',
            title: ls.get('MANAGE_PAGES'),
            icon: 'refresh',
            href: '/admin/content/pages'
        }, {
            name: 'new_page',
            title: '' ,
            icon: 'plus',
            href: '/admin/content/pages/new'
        }];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManagePages.getSubNavItems);

    //exports
    return ManagePages;
};
