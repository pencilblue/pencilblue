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

    	pb.templates.load('admin/content/articles/manage_articles', '^loc_MANAGE_ARTICLES^', null, function(data) {
            var result = '' + data;
            
            self.displayErrorOrSuccess(result, function(newResult) {
                result = newResult;
                
                var pills = Articles.getPillNavOptions('manage_articles');
                pills.unshift(
                {
                    name: 'manage_articles',
                    title: '^loc_MANAGE_ARTICLES^',
                    icon: 'refresh',
                    href: '/admin/content/articles/manage_articles'
                });
                
                pb.users.getAuthors(articles, function(err, articlesWithAuthorNames) {                                
                    result = result.concat(pb.js.getAngularController(
                    {
                        navigation: pb.AdminNavigation.get(self.session, ['content', 'articles']),
                        pills: pills,
                        articles: articlesWithAuthorNames
                    }, [], 'initArticlesPagination()'));
                    
                    var content = self.localizationService.localize(['admin', 'articles'], result);
                    cb({content: content});
                });
            });
        });
    });
};

//exports
module.exports = ManageArticles;
