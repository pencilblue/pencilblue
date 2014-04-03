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
	
	this.setPageName(self.ls.get('NEW_PAGE'));
	self.ts.load('admin/content/pages/new_page', function(err, data) {
        var result = '' + data;
        var tabs   =
        [
            {
                active: 'active',
                href: '#content',
                icon: 'quote-left',
                title: self.ls.get('CONTENT')
            },
            {
                href: '#media',
                icon: 'camera',
                title: self.ls.get('MEDIA')
            },
            {
                href: '#topics_dnd',
                icon: 'tags',
                title: self.ls.get('TOPICS')
            },
            {
                href: '#seo',
                icon: 'tasks',
                title: self.ls.get('SEO')
            }
        ];
        
        self.ts.getTemplatesForActiveTheme(function(templates) {
        	
        	var dao = new pb.DAO();
        	dao.query('topic', pb.DAO.ANYEHERE, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(topics) {
        		//TODO handle errors
        		
        		Media.getAll(function(media){                            
                    self.checkForFormRefill(result, function(newResult) {
                        result = newResult;
                        
                        var pills = Pages.getPillNavOptions('new_page');
                        pills.unshift(
                        {
                            name: 'manage_pages',
                            title: self.getPageName(),
                            icon: 'chevron-left',
                            href: '/admin/content/pages/manage_pages'
                        });
                        
                        result = result.concat(pb.js.getAngularController(
                        {
                            navigation: pb.AdminNavigation.get(self.session, ['content', 'pages'], self.ls),
                            pills: pills,
                            tabs: tabs,
                            templates: templates,
                            topics: topics,
                            media: media
                        }, [], 'initMediaPagination();initTopicsPagination()'));
            
                        cb({content: result});
                    });
                });
            });
        });
    });
};

//exports
module.exports = NewPage;
