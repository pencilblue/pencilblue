/**
 * 
 * @copyright PencilBlue, LLC 2014 All Rights Reserved
 */
function Index(){}

//inheritance
util.inherits(Index, pb.BaseController);

Index.prototype.render = function(cb) {
	var self = this;
	
	//user doesn't have credentials for this
	if(!pb.security.isAuthorized(this.session, {authenticated: true, admin_level: ACCESS_WRITER})) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/login')); 
        return;
    }

    pb.templates.load('admin/index', '^loc_DASHBOARD^', null, function(data) {
        var result = data;
        var dao    = new pb.DAO();
        
        dao.count('article', pb.DAO.ANYWHERE, function(err, articleCount) {
            
        	var name        = self.localizationService.localize(['admin'], '^loc_ARTICLES^');
        	var contentInfo = [{name: name, count: articleCount, href: '/admin/content/articles/manage_articles'}];
            
        	dao.count('page', pb.DAO.ANYWHERE, function(err, pageCount) {
                
        		name = self.localizationService.localize(['admin'], '^loc_PAGES^');
            	contentInfo.push({name: name, count: pageCount, href: '/admin/content/pages/manage_pages'});
                
            	var angular = pb.js.getAngularController(
                    {
                        navigation: pb.AdminNavigation.get(self.session, ['dashboard']),
                        contentInfo: contentInfo
                    }
                );
                result = result.concat(angular);
                
                var content = self.localizationService.localize(['admin'], result);
                cb({content: content});
            });
        });
        
    });
};

//exports
module.exports = Index;
