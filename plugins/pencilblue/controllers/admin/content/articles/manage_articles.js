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
    
    /**
     * Interface for managing articles
     */
    function ManageArticles(){}
    util.inherits(ManageArticles, pb.BaseController);

    //statics
    var SUB_NAV_KEY = 'manage_articles';

    ManageArticles.prototype.render = function(cb) {
        var self = this;
        var dao  = new pb.DAO();

        var where = {};
        if(!pb.security.isAuthorized(this.session, {logged_in: true, admin_level: pb.SecurityService.ACCESS_EDITOR})) {
            where.author = this.session.authentication.user_id;
        }

        var opts = {
            select: {
                headline: 1,
                draft: 1,
                url: 1,
                author: 1,
                publish_date: 1
            },
            where: where,
            order: {publish_date: pb.DAO.ASC},

        };
        dao.q('article', opts, function(err, articles) {
            if(util.isError(err)) {
                return self.reqHandler.serveError(err);
            }
            else if (articles.length <= 0) {
                return self.redirect('/admin/content/articles/new', cb);
            }

            pb.users.getAuthors(articles, function(err, articlesWithAuthorNames) {
                articles = self.getArticleStatuses(articlesWithAuthorNames);
                var angularObjects = pb.ClientJs.getAngularObjects(
                {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'articles'], self.ls),
                    pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY),
                    articles: articles
                });

                var manageArticlesStr = self.ls.get('MANAGE_ARTICLES');
                self.setPageName(manageArticlesStr);
                self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
                self.ts.load('admin/content/articles/manage_articles',  function(err, data) {
                    var result = '' + data;
                    cb({content: result});
                });
            });
        });
    };

    ManageArticles.prototype.getArticleStatuses = function(articles) {
        var now = new Date();
        for(var i = 0; i < articles.length; i++) {
            if(articles[i].draft) {
                articles[i].status = this.ls.get('DRAFT');
            }
            else if(articles[i].publish_date > now) {
                articles[i].status = this.ls.get('UNPUBLISHED');
            }
            else {
                articles[i].status = this.ls.get('PUBLISHED');
            }
        }

        return articles;
    };

    ManageArticles.getSubNavItems = function(key, ls, data) {
        return [{
            name: 'manage_articles',
            title: ls.get('MANAGE_ARTICLES'),
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
