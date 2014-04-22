/**
 * DeleteArticle - Deletes articles
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function DeleteArticle(){}

//inheritance
util.inherits(DeleteArticle, pb.BaseController);

DeleteArticle.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;
	
    var message = this.hasRequiredParams(vars, ['id']);
    if (message) {
        this.formError(message, '/admin/content/articles/manage_articles', cb);
        return;
    }
    
    var dao = new pb.DAO();
    dao.query('article', {_id: ObjectID(vars['id'])}).then(function(articles) {
        if(articles.length == 0) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/articles/manage_articles', cb);
            return;
        }
        
        var article = articles[0];
        dao.deleteMatching({_id: ObjectID(vars['id'])}, 'article').then(function(articlesDeleted) {
            if(util.isError(articlesDeleted) || articlesDeleted <= 0) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/articles/manage_articles', cb);
                return;
            }
            
            self.session.success = article.headline + ' ' + self.ls.get('DELETED');
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/articles/manage_articles'));
        });
    });
};

//exports
module.exports = DeleteArticle;
