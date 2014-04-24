/**
 * EditPage - Interface for editing an page
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditPage(){}

//dependencies
var Media = require('../media.js');
var Pages = require('../pages');

//inheritance
util.inherits(EditPage, pb.BaseController);

EditPage.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;
	
    if(!vars['id']) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/pages/manage_pages'));
        return;
    }
    
    var dao = new pb.DAO();
    dao.loadById(vars['id'], 'page', function(err, page) {
        if(page == null) {
        	cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/pages/manage_pages'));
            return;
        }
        
        page.page_media  = page.page_media.join(',');
        page.page_topics = page.page_topics.join(',');
        self.setFormFieldValues(page);
        
        //ensure that only the author can edit page
        //TODO should global administrator be able to do this too?
        if(self.session.authentication.user_id !== page.author) {
        	self.redirect(pb.config.siteRoot + '/admin/content/pages/manage_pages', cb);
            return;
        }

        self.setPageName(page.headline);
        self.ts.registerLocal('page_id', vars['id']);
        self.ts.load('admin/content/pages/edit_page', function(err, data) {
            var result = '' + data;
            var tabs   =
            [
                {
                    active: true,
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
            
            self.ts.getTemplatesForActiveTheme(function(err, templates) {
            	
            	dao.query('topic', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(topics) {
                    
            		Media.getAll(function(media) {                            
                        
            			self.checkForFormRefill(result, function(newResult) {
                            result = newResult;
                            
                            var pills = Pages.getPillNavOptions('edit_page');
                            pills.unshift(
                            {
                                name: 'manage_pages',
                                title: page.headline,
                                icon: 'chevron-left',
                                href: '/admin/content/pages/manage_pages'
                            });
                            
                            result = result.split('^angular_script^').join(pb.js.getAngularController(
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
    });
};

//exports
module.exports = EditPage;
