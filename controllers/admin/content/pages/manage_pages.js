/**
 * ManagePages - Displays articles for management
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ManagePages(){}

//dependencies
var Pages = require('../pages');

//inheritance
util.inherits(ManagePages, pb.BaseController);

//statics
var SUB_NAV_KEY = 'manage_pages';

ManagePages.prototype.render = function(cb) {
	var self = this;
	var dao  = new pb.DAO();
	
    dao.query('page', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {headline: pb.DAO.ASC}).then(function(pages) {
        if(pages.length == 0) {
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/pages/new_page'));
            return;
        }
        
        var title = self.ls.get('MANAGE_PAGES');
        self.setPageName(title);
        self.ts.load('admin/content/pages/manage_pages', function(err, data) {
            var result = '' + data;
                
            pb.users.getAuthors(pages, function(err, pagesWithAuthor) {
                
            	var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'manage_pages');
                result    = result.split('^angular_script^').join(pb.js.getAngularController(
                {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'pages'], self.ls),
                    pills: pills,
                    pages: pages
                }, [], 'initPagesPagination()'));

                cb({content: result});
            });
        });
    });
};

ManagePages.getSubNavItems = function(key, ls, data) {
	var pills = Pages.getPillNavOptions();
	pills.unshift(
    {
        name: 'manage_pages',
        title: ls.get('MANAGE_PAGES'),
        icon: 'refresh',
        href: '/admin/content/pages/manage_pages'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManagePages.getSubNavItems);

//exports
module.exports = ManagePages;
