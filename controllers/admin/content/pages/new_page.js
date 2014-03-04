/**
 * NewPage - Interface for adding a new page
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewPage(){}

//dependencies
var Media = require('../media.js');
var Pages = require('../pages');

//inheritance
util.inherits(NewPage, pb.BaseController);

NewPage.prototype.render = function(cb) {
	var self = this;
	
	pb.templates.load('admin/content/pages/new_page', '^loc_NEW_PAGE^', null, function(data) {
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
                href: '#topics_dnd',
                icon: 'tags',
                title: '^loc_TOPICS^'
            },
            {
                href: '#seo',
                icon: 'tasks',
                title: '^loc_SEO^'
            }
        ];
        
        pb.templates.getTemplatesForActiveTheme(function(templates) {
        	
        	var dao = new pb.DAO();
        	dao.query('topic', pb.DAO.ANYEHERE, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(topics) {
        		//TODO handle errors
        		
        		Media.getAll(function(media){                            
                    self.prepareFormReturns(result, function(newResult) {
                        result = newResult;
                        
                        var pills = Pages.getPillNavOptions('new_page');
                        pills.unshift(
                        {
                            name: 'manage_pages',
                            title: '^loc_NEW_PAGE^',
                            icon: 'chevron-left',
                            href: '/admin/content/pages/manage_pages'
                        });
                        
                        result = result.concat(pb.js.getAngularController(
                        {
                            navigation: pb.AdminNavigation.get(self.session, ['content', 'pages']),
                            pills: pills,
                            tabs: tabs,
                            templates: templates,
                            topics: topics,
                            media: media
                        }, [], 'initMediaPagination();initTopicsPagination()'));
            
                        var content = self.localizationService.localize(['admin', 'pages', 'articles', 'media'], result);
                        cb({content: content});
                    });
                });
            });
        });
    });
};

//exports
module.exports = NewPage;
