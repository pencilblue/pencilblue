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
	var self = this;
	
	pb.templates.load('admin/content/articles/new_article', '^loc_NEW_ARTICLE^', null, function(data) {
        var result = '' + data;
        var tabs   =
        [
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
        
        var dao   = new pb.DAO();
        var tasks = {
        	templates: function(callback) {
        		pb.templates.getTemplatesForActiveTheme(function(templates) {
        			callback(null, templates);
        		});
        	},
        	
        	sections: function(callback) {
        		dao.query('section', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {name: 1}).then(function(sections){
        			callback(util.isError(sections) ? sections : null, sections);
        		});
        	},
        	
        	topics: function(callback) {
        		dao.query('topic', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {name: 1}).then(function(topics){
        			callback(util.isError(topics) ? topics : null, topics);
        		});
        	},
        	
        	media: function(callback) {
        		Media.getAll(function(media){
        			callback(null, media);
        		});
        	}
        };
        async.parallelLimit(tasks, 2, function(err, results){
        	//TODO handle error
        	
        	self.prepareFormReturns(result, function(newResult) {
                result = newResult;
                
                var pills = Articles.getPillNavOptions('new_article');
                pills.unshift(
                {
                    name: 'manage_articles',
                    title: '^loc_NEW_ARTICLE^',
                    icon: 'chevron-left',
                    href: '/admin/content/articles/manage_articles'
                });
                
                result = result.concat(pb.js.getAngularController(
                {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'articles']),
                    pills: pills,
                    tabs: tabs,
                    templates: results.templates,
                    sections: results.sections,
                    topics: results.topics,
                    media: results.media
                }, [], 'initMediaPagination();initSectionsPagination();initTopicsPagination()'));
                
                var content = self.localizationService.localize(['admin', 'articles', 'media'], result);
                cb({content: content});
            });
        });
    });
};

NewArticle.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            output({redirect: pb.config.siteRoot});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/content/articles/new_article', '^loc_NEW_ARTICLE^', null, function(data)
            {
                result = result.concat(data);
                
                var tabs =
                [
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
                
                var articles = require('../articles');
                    
                articles.getTemplates(function(templates)
                {                        
                    getDBObjectsWithValues({object_type: 'section', $orderby: {name: 1}}, function(sections)
                    {
                        getDBObjectsWithValues({object_type: 'topic', $orderby: {name: 1}}, function(topics)
                        {
                            articles.getMedia(function(media)
                            {                            
                                prepareFormReturns(session, result, function(newSession, newResult)
                                {
                                    session = newSession;
                                    result = newResult;
                                    
                                    var pills = articles.getPillNavOptions('new_article');
                                    pills.unshift(
                                    {
                                        name: 'manage_articles',
                                        title: '^loc_NEW_ARTICLE^',
                                        icon: 'chevron-left',
                                        href: '/admin/content/articles/manage_articles'
                                    });
                                    
                                    result = result.concat(pb.js.getAngularController(
                                    {
                                        navigation: getAdminNavigation(session, ['content', 'articles']),
                                        pills: pills,
                                        tabs: tabs,
                                        templates: templates,
                                        sections: sections,
                                        topics: topics,
                                        media: media
                                    }, [], 'initMediaPagination();initSectionsPagination();initTopicsPagination()'));
                                    
                                    editSession(request, session, [], function(data)
                                    {
                                        output({content: localize(['admin', 'articles', 'media'], result)});
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

//exports
module.exports = NewArticle;
