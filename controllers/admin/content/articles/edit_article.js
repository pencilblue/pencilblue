/**
 * EditArticle - Interface for editing an article
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditArticle(){}

//dependencies
NewArticle = require('./new_article.js');
Articles   = require('../articles.js');
Media      = require('../media.js');

//inheritance
util.inherits(EditArticle, NewArticle);

EditArticle.prototype.render = function(cb) {
	var self = this;
	var get  = this.query;
    if(!get.id)  {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/articles/manage_articles'));
        return;
    }
    var dao = new pb.DAO();
    dao.loadById(get.id, 'article', function(err, article) {
        if(util.isError(err) || article == null) {
        	self.redirect(pb.config.siteRoot + '/admin/content/articles/manage_articles', cb);
            return;
        }
        
        if(!pb.security.isAuthorized(self.session, {logged_in: true, admin_level: ACCESS_EDITOR})) {
            if(!self.session.authentication.user_id.equals(article.author)) {
                cb({redirect: pb.config.siteRoot + '/admin/content/articles/manage_articles'});
                return;
            }
        }
        
        self.article = article;
        article.article_media    = article.article_media.join(',');
        article.article_sections = article.article_sections.join(',');
        article.article_topics   = article.article_topics.join(',');
        self.setFormFieldValues(article);

        //call the parent function
        EditArticle.super_.prototype.render.apply(self, [cb]);
    });
};

EditArticle.prototype.onTemplateRetrieved = function(template, cb) {
	cb(null, template.split('^article_id^').join(this.query.id));
};

EditArticle.prototype.getBreadCrum = function() {
	return {
        name: 'manage_articles',
        title: this.article.headline,
        icon: 'chevron-left',
        href: '/admin/content/articles/manage_articles'
    };
};

EditArticle.prototype.getActivePill = function() {
	return 'edit_article';
};

EditArticle.prototype.getPageTitle = function() {
	return this.ls.get('EDIT') + ' ' + this.article.headline;
};

EditArticle.prototype.getTemplateLocation = function() {
	return 'admin/content/articles/edit_article';
};

//exports
module.exports = EditArticle;
