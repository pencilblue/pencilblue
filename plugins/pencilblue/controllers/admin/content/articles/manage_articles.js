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
     * Interface for managing articles
     */
    function ManageArticles(){}
    util.inherits(ManageArticles, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'manage_articles';

    ManageArticles.prototype.render = function(cb) {
        var self = this;
        if(!pb.security.isAuthorized(this.session, {logged_in: true, admin_level: pb.SecurityService.ACCESS_EDITOR})) {
            where.author = this.session.authentication.user_id;
        }

        var angularObjects = pb.ClientJs.getAngularObjects({
            navigation: pb.AdminNavigation.get(self.session, ['content', 'articles'], self.ls, self.site),
            pills: self.getAdminPills(SUB_NAV_KEY, self.ls, SUB_NAV_KEY)
        });

        self.setPageName(self.ls.g('articles.MANAGE_ARTICLES'));
        self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
        self.ts.load('admin/content/articles/manage_articles', function (err, data) {
            var result = '' + data;
            cb({content: result});
        });
    };

    ManageArticles.getSubNavItems = function(key, ls, data) {
        return [{
            name: 'manage_articles',
            title: ls.g('articles.MANAGE_ARTICLES'),
            icon: 'refresh',
            href: '/admin/content/articles'
        }, {
            name: 'new_article',
            title: '',
            icon: 'plus',
            href: '/admin/content/articles/new'
        }];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageArticles.getSubNavItems);

    //exports
    return ManageArticles;
};
