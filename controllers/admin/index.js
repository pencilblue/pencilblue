/**
 * 
 * @copyright PencilBlue, LLC 2014 All Rights Reserved
 */
function Index(){}

//inheritance
util.inherits(Index, pb.BaseController);

Index.prototype.render = function(cb) {
	var self = this;

	this.setPageName(this.localizationService.get('DASHBOARD'));
    this.templateService.load('admin/index', function(error, data) {
        var result = data;
        var dao    = new pb.DAO();
        
        dao.count('article', pb.DAO.ANYWHERE, function(err, articleCount) {
            
        	var name        = self.localizationService.get('ARTICLES');
        	var contentInfo = [{name: name, count: articleCount, href: '/admin/content/articles/manage_articles'}];
            
        	dao.count('page', pb.DAO.ANYWHERE, function(err, pageCount) {
                
        		name = self.localizationService.get('PAGES');
            	contentInfo.push({name: name, count: pageCount, href: '/admin/content/pages/manage_pages'});
                
            	var angular = pb.js.getAngularController(
                    {
                        navigation: pb.AdminNavigation.get(self.session, ['dashboard'], self.localizationService),
                        contentInfo: contentInfo
                    }
                );
                result = result.split('^angular_script^').join(angular);
                
                cb({content: result});
            });
        });
    });
};

//exports
module.exports = Index;
