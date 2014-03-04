/**
 * ManagePages - Displays articles for management
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ManagePages(){}

//inheritance
util.inherits(ManagePages, pb.BaseController);

ManagePages.prototype.render = function(cb) {
	var self = this;
	var dao  = new pb.DAO();
	
    dao.query('page', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {headline: pb.DAO.ASC}).then(function(pages) {
        if(pages.length == 0) {
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/pages/new_page'));
            return;
        }
        
        pb.templates.load('admin/content/pages/manage_pages', '^loc_MANAGE_PAGES^', null, function(data) {
            var result = '' + data;
            
            self.displayErrorOrSuccess(result, function(newResult) {
                result = newResult;
                
                pb.users.getAuthors(pages, function(err, pagesWithAuthor) {
                    
                	var pills = require('../pages').getPillNavOptions('manage_pages');
                    pills.unshift(
                    {
                        name: 'manage_pages',
                        title: '^loc_MANAGE_PAGES^',
                        icon: 'refresh',
                        href: '/admin/content/pages/manage_pages'
                    });
                    
                    result = result.concat(pb.js.getAngularController(
                    {
                        navigation: pb.AdminNavigation.get(self.session, ['content', 'pages']),
                        pills: pills,
                        pages: pages
                    }, [], 'initPagesPagination()'));
                    
                    var content = self.localizationService.localize(['admin', 'pages'], result);
                    cb({content: content});
                });
            });
        });
    });
};

//exports
module.exports = ManagePages;
