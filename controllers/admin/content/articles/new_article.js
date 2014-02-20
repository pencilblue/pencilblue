/**
 * NewArticle - Interface for adding a new article
 * 
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
	
	var title = this.getPageTitle();
	pb.templates.load(this.getTemplateLocation(), title, null, function(data) {
        var result = '' + data;
        var tabs   = self.getTabs();
        
        self.gatherData(function(err, results){
        	//TODO handle error
        	
        	self.prepareFormReturns(result, function(newResult) {
                result = newResult;
                
                var pills = self.getPills();
                result    = result.concat(self.getAngularController(pills, tabs, results));
                
                var content = self.localizationService.localize(['admin', 'articles', 'media'], result);
                cb({content: content});
            });
        });
    });
};

NewArticle.prototype.getAngularController = function(pills, tabs, data) {
	var objects = {
        navigation: pb.AdminNavigation.get(this.session, ['content', 'articles']),
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
        title: '^loc_NEW_ARTICLE^',
        icon: 'chevron-left',
        href: '/admin/content/articles/manage_articles'
    };
};

NewArticle.prototype.getActivePill = function() {
	return 'new_article';
};

NewArticle.prototype.getPageTitle = function() {
	return '^loc_NEW_ARTICLE^';
};

NewArticle.prototype.getTemplateLocation = function() {
	return 'admin/content/articles/new_article';
};

NewArticle.prototype.gatherData = function(cb) {
	var dao   = new pb.DAO();
    var tasks = {
    	templates: function(callback) {
    		pb.templates.getTemplatesForActiveTheme(function(templates) {
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
            title: '^loc_CONTENT^'
        },
        {
            href: '#media',
            icon: 'camera',
            title: '^loc_MEDIA^'
        },
        {
            href: '#sections_dnd',
            icon: 'th-large',
            title: '^loc_SECTIONS^'
        },
        {
            href: '#topics_dnd',
            icon: 'tags',
            title: '^loc_TOPICS^'
        },
        {
            href: '#meta_data',
            icon: 'tasks',
            title: '^loc_META_DATA^'
        }
    ];
};

//exports
module.exports = NewArticle;
