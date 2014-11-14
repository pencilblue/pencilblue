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
 * Interface for creating and editing articles
 */

function ArticleForm(){}

//inheritance
util.inherits(ArticleForm, pb.BaseController);

ArticleForm.prototype.render = function(cb) {
	var self  = this;
	var vars = this.pathVars;
	this.vars = vars;

    self.gatherData(vars, function(err, results){
		if(util.isError(err)) {
			throw err;
		}
		else if(!results.article) {
			self.reqHandler.serve404();
			return;
		}

        self.article = results.article;
        var tabs   = self.getTabs();

		self.setPageName(self.article._id ? self.article.headline : self.ls.get('NEW_ARTICLE'));
		self.ts.registerLocal('angular_script', '');
		self.ts.registerLocal('angular_objects', new pb.TemplateValue(self.getAngularObjects(tabs, results), false));
    	self.ts.load('admin/content/articles/article_form', function(err, data) {
    		self.onTemplateRetrieved('' + data, function(err, data) {
    	        var result = '' + data;
                self.checkForFormRefill(result, function(newResult) {
                    result = newResult;
                    cb({content: result});
                });
    		});
        });
    });
};

ArticleForm.prototype.onTemplateRetrieved = function(template, cb) {
	cb(null, template);
};

ArticleForm.prototype.getAngularObjects = function(tabs, data) {
	if(data.article._id) {
		var media = [];
		var i, j;

		for(i = 0; i < data.article.article_media.length; i++) {
			for(j = 0; j < data.media.length; j++) {
				if(data.media[j]._id.equals(ObjectID(data.article.article_media[i]))) {
					media.push(data.media[j]);
					data.media.splice(j, 1);
					break;
				}
			}
		}
		data.article.article_media = media;

		var sections = [];
		for(i = 0; i < data.article.article_sections.length; i++) {
			for(j = 0; j < data.sections.length; j++) {
				if(data.sections[j]._id.equals(ObjectID(data.article.article_sections[i]))) {
					sections.push(data.sections[j]);
					data.sections.splice(j, 1);
					break;
				}
			}
		}
		data.article.article_sections = sections;

		var topics = [];
		for(i = 0; i < data.article.article_topics.length; i++) {
			for(j = 0; j < data.topics.length; j++) {
				if(data.topics[j]._id.equals(ObjectID(data.article.article_topics[i]))) {
					topics.push(data.topics[j]);
					data.topics.splice(j, 1);
					break;
				}
			}
		}
		data.article.article_topics = topics;
	}

	var objects = {
        navigation: pb.AdminNavigation.get(this.session, ['content', 'articles'], this.ls),
        pills: pb.AdminSubnavService.get(this.getActivePill(), this.ls, this.getActivePill(), data),
        tabs: tabs,
        templates: data.templates,
        sections: data.sections,
        topics: data.topics,
        media: data.media,
		article: data.article
    };
	return pb.js.getAngularObjects(objects);
};

ArticleForm.getSubNavItems = function(key, ls, data) {
	return [{
	    name: 'manage_articles',
	    title: data.article._id ? ls.get('EDIT') + ' ' + data.article.headline : ls.get('NEW_ARTICLE'),
	    icon: 'chevron-left',
	    href: '/admin/content/articles'
	}, {
        name: 'new_article',
        title: '',
        icon: 'plus',
        href: '/admin/content/articles/new'
    }];
};

ArticleForm.prototype.getActivePill = function() {
	return 'new_article';
};

ArticleForm.prototype.gatherData = function(vars, cb) {
	var self  = this;
	var dao   = new pb.DAO();
    var tasks = {
    	templates: function(callback) {
            callback(null, pb.TemplateService.getAvailableContentTemplates());
    	},

    	sections: function(callback) {
    		var where = {
    			type: {$in: ['container', 'section']}
    		};
    		dao.query('section', where, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(sections){
    			callback(util.isError(sections) ? sections : null, sections);
    		});
    	},

    	topics: function(callback) {
    		dao.query('topic', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(topics){
    			callback(util.isError(topics) ? topics : null, topics);
    		});
    	},

    	media: function(callback) {
            var mservice = new pb.MediaService();
    		mservice.get(callback);
    	},

		article: function(callback) {
			if(!vars.id) {
				callback(null, {});
				return;
			}

			dao.loadById(vars.id, 'article', function(err, article) {
				callback(err, article);
			});
		}
    };
    async.parallelLimit(tasks, 2, cb);
};

ArticleForm.prototype.getTabs = function() {
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
            href: '#sections_dnd',
            icon: 'th-large',
            title: this.ls.get('SECTIONS')
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
pb.AdminSubnavService.registerFor('new_article', ArticleForm.getSubNavItems);

//exports
module.exports = ArticleForm;
