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
'use strict';

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

        var angularObjects = pb.ClientJs.getAngularObjects({
            navigation: pb.AdminNavigation.get(self.session, ['content', 'pages'], self.ls, self.site),
            pills: self.getAdminPills(SUB_NAV_KEY, self.ls, SUB_NAV_KEY)
        });

        self.setPageName(self.ls.g('pages.MANAGE_PAGES'));
        self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
        self.ts.load('admin/content/pages/manage_pages', function(err, data) {
            var result = '' + data;
            cb({content: result});
        });
    };

    ManagePages.getSubNavItems = function(key, ls, data) {
        return [{
            name: 'manage_pages',
            title: ls.g('pages.MANAGE_PAGES'),
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
