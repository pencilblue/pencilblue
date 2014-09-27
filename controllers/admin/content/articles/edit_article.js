/*
    Copyright (C) 2014  PencilBlue, LLC

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

/**
 * Interface for editing an article
 */

function EditArticle(){}

//dependencies
NewArticle = require('./new_article.js');
Articles   = require('../articles.js');
Media      = require('../media.js');

//inheritance
util.inherits(EditArticle, NewArticle);

EditArticle.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;
    if(!vars.id)  {
        self.redirect('/admin/content/articles/manage_articles', cb);
        return;
    }
    var dao = new pb.DAO();
    dao.loadById(vars.id, 'article', function(err, article) {
        if(util.isError(err) || article === null) {
        	self.redirect('/admin/content/articles/manage_articles', cb);
            return;
        }

        if(!pb.security.isAuthorized(self.session, {logged_in: true, admin_level: ACCESS_EDITOR})) {
            if(self.session.authentication.user_id !== article.author) {
                self.redirect('/admin/content/articles/manage_articles', cb);
                return;
            }
        }

        self.article = article;

        //call the parent function
        self.setPageName(article.headline);
        self.ts.registerLocal('article_id', vars.id);
        EditArticle.super_.prototype.render.apply(self, [cb]);
    });
};

EditArticle.prototype.onTemplateRetrieved = function(template, cb) {
	cb(null, template);
};

EditArticle.prototype.getAngularObjects = function(tabs, data) {
    var self = this;

	var media = [];
	for(var i = 0; i < self.article.article_media.length; i++) {
		for(var j = 0; j < data.media.length; j++) {
			if(data.media[j]._id.equals(ObjectID(self.article.article_media[i]))) {
				media.push(data.media[j]);
				data.media.splice(j, 1);
				break;
			}
		}
	}
	self.article.article_media = media;

	var objects = {
        navigation: pb.AdminNavigation.get(this.session, ['content', 'articles'], this.ls),
        pills: pb.AdminSubnavService.get(this.getActivePill(), this.ls, this.getActivePill(), self.article),
        tabs: tabs,
        templates: data.templates,
        sections: data.sections,
        topics: data.topics,
        media: data.media,
        article: self.article
    };
	return pb.js.getAngularObjects(objects);
};

EditArticle.prototype.getActivePill = function() {
	return 'edit_article';
};

EditArticle.prototype.getPageTitle = function() {
	return this.ls.get('EDIT') + ' ' + this.article.headline;
};

EditArticle.getSubNavItems = function(key, ls, data) {
	return [
		{
		    name: 'manage_articles',
		    title: data.headline,
		    icon: 'chevron-left',
		    href: '/admin/content/articles/manage_articles'
		},
        {
            name: 'new_article',
            title: '',
            icon: 'plus',
            href: '/admin/content/articles/new_article'
        }
    ];
};

//register admin sub-nav
pb.AdminSubnavService.registerFor('edit_article', EditArticle.getSubNavItems);

//exports
module.exports = EditArticle;
