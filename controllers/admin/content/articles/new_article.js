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
 * Interface for creating a new article
 */

function NewArticle(){}

//dependencies
var Articles = require('../articles.js');
var Media    = require('../media.js');

//inheritance
util.inherits(NewArticle, pb.BaseController);

NewArticle.prototype.render = function(cb) {
	var self  = this;

    self.gatherData(function(err, results){
        //TODO handle error
        var tabs   = self.getTabs();

        self.ts.registerLocal('angular_script', self.getAngularController(tabs, results));
    	self.ts.load(self.getTemplateLocation(), function(err, data) {
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

NewArticle.prototype.onTemplateRetrieved = function(template, cb) {
	cb(null, template);
};

NewArticle.prototype.getAngularController = function(tabs, data) {
	var objects = {
        navigation: pb.AdminNavigation.get(this.session, ['content', 'articles'], this.ls),
        pills: pb.AdminSubnavService.get(this.getActivePill(), this.ls, this.getActivePill(), data),
        tabs: tabs,
        templates: data.templates,
        sections: data.sections,
        topics: data.topics,
        media: data.media
    };
	return pb.js.getAngularController(
		objects,
		[],
		'initMediaPagination();initSectionsPagination();initTopicsPagination()'
	);
};


NewArticle.getSubNavItems = function(key, ls, data) {
	return [
		{
		    name: 'manage_articles',
		    title: ls.get('NEW_ARTICLE'),
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

NewArticle.prototype.getActivePill = function() {
	return 'new_article';
};

NewArticle.prototype.getPageTitle = function() {
	return this.ls.get('NEW_ARTICLE');
};

NewArticle.prototype.getTemplateLocation = function() {
	return 'admin/content/articles/new_article';
};

NewArticle.prototype.gatherData = function(cb) {
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
    	}
    };
    async.parallelLimit(tasks, 2, cb);
};

NewArticle.prototype.getTabs = function() {
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
pb.AdminSubnavService.registerFor('new_article', NewArticle.getSubNavItems);

//exports
module.exports = NewArticle;
