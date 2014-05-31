/**
 * ManageArticles - Displays articles for management
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ManageArticles(){}

//dependencies
Articles = require('../articles.js');

//inheritance
util.inherits(ManageArticles, pb.BaseController);

//statics
var SUB_NAV_KEY = 'manage_articles';

ManageArticles.prototype.render = function(cb) {
	var self = this;
	var dao  = new pb.DAO();
	
	var where = {};
    if(!pb.security.isAuthorized(this.session, {logged_in: true, admin_level: ACCESS_EDITOR})) {
        where.author = this.session.user._id.toString();
    }
    
    dao.query('article', where, pb.DAO.PROJECT_ALL, {publish_date: pb.DAO.ASC}).then(function(articles) {
        if(util.isError(articles) || articles.length <= 0) {
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/articles/new_article'));
            return;
        }

        var manageArticlesStr = self.ls.get('MANAGE_ARTICLES');
        self.setPageName(manageArticlesStr);
    	self.ts.load('admin/content/articles/manage_articles',  function(err, data) {
            var result = '' + data;
            
                
            var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY);
            pb.users.getAuthors(articles, function(err, articlesWithAuthorNames) {                                
                result = result.split('^angular_script^').join(pb.js.getAngularController(
                {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'articles'], self.ls),
                    pills: pills,
                    articles: articlesWithAuthorNames
                }, [], 'initArticlesPagination()'));
                
                cb({content: result});
            });
        });
    });
};

ManageArticles.getSubNavItems = function(key, ls, data) {
	return [
		{
            name: 'manage_articles',
            title: ls.get('MANAGE_ARTICLES'),
            icon: 'refresh',
            href: '/admin/content/articles/manage_articles'
        },
        {
		    name: 'new_article',
		    title: '',
		    icon: 'plus',
		    href: '/admin/content/articles/new_article'
		}
    ];
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageArticles.getSubNavItems);

//exports
module.exports = ManageArticles;
