/**
 * Interface for adding a new article
 * 
 * @class NewArticle
 * @constructor
 * @module Controllers
 * @submodule Admin
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewArticle(){}

//dependencies
var Articles = require('../articles.js');
var Media    = require('../media.js');

//inheritance
util.inherits(NewArticle, pb.BaseController);

NewArticle.prototype.render = function(cb) {
	var self  = this;
	
	this.ts.load(this.getTemplateLocation(), function(err, data) {
		self.onTemplateRetrieved('' + data, function(err, data) {
	        var result = '' + data;
	        var tabs   = self.getTabs();
	        
	        self.gatherData(function(err, results){
	        	//TODO handle error
	        	
	        	self.prepareFormReturns(result, function(newResult) {
	                result = newResult;
	                
	                var pills = self.getPills();
	                result    = result.concat(self.getAngularController(pills, tabs, results));
	                
	                cb({content: result});
	            });
	        });
		});
    });
};

NewArticle.prototype.onTemplateRetrieved = function(template, cb) {
	cb(null, template);
};

NewArticle.prototype.getAngularController = function(pills, tabs, data) {
	var objects = {
        navigation: pb.AdminNavigation.get(this.session, ['content', 'articles'], this.ls),
        pills: pills,
        tabs: tabs,
        templates: data.templates,
        sections: data.sections,
        topics: data.topics,
        media: data.media
    };
	return angular = pb.js.getAngularController(
		objects, 
		[], 
		'initMediaPagination();initSectionsPagination();initTopicsPagination()'
	);
};

NewArticle.prototype.getPills = function() {
	var pills = Articles.getPillNavOptions(this.getActivePill());
    pills.unshift(this.getBreadCrum());
    return pills;
};

NewArticle.prototype.getBreadCrum = function() {
	return {
        name: 'manage_articles',
        title: this.ls.get('NEW_ARTICLE'),
        icon: 'chevron-left',
        href: '/admin/content/articles/manage_articles'
    };
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
    		self.ts.getTemplatesForActiveTheme(function(err, templates) {
    			callback(null, templates);
    		});
    	},
    	
    	sections: function(callback) {
    		dao.query('section', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(sections){
    			callback(util.isError(sections) ? sections : null, sections);
    		});
    	},
    	
    	topics: function(callback) {
    		dao.query('topic', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(topics){
    			callback(util.isError(topics) ? topics : null, topics);
    		});
    	},
    	
    	media: function(callback) {
    		Media.getAll(function(media){
    			callback(null, media);
    		});
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
            title: this.ls.get('MEDIA^')
        },
        {
            href: '#sections_dnd',
            icon: 'th-large',
            title: this.ls.get('SECTIONS^')
        },
        {
            href: '#topics_dnd',
            icon: 'tags',
            title: this.ls.get('TOPICS^')
        },
        {
            href: '#seo',
            icon: 'tasks',
            title: this.ls.get('SEO^')
        }
    ];
};

//exports
module.exports = NewArticle;
