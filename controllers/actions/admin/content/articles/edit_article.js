/**
 * EditArticle - Interface for adding a new article
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditArticle(){}

//inheritance
util.inherits(EditArticle, pb.FormController);

EditArticle.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var get  = this.query;
    
    delete post['section_search'];
    delete post['topic_search'];
    delete post['media_search'];
    delete post['media_url'];
    delete post['media_type'];
    delete post['location'];
    delete post['thumb'];
    delete post['media_topics'];
    delete post['name'];
    delete post['caption'];
    delete post['layout_link_url'];
    delete post['media_position'];
    delete post['media_max_height'];
    
    post['author']         = this.session.authentication.user_id;
    post['publish_date']   = new Date(post['publish_date']);
    post['article_layout'] = decodeURIComponent(post['article_layout']);
    
    //add get params to post
    pb.utils.merge(get, post);
    
    var message = this.hasRequiredParams(post, this.getRequiredFields());
    if (message) {
        this.formError(message, '/admin/content/articles/manage_articles', cb);
        return;
    }
    
    var dao = new pb.DAO();
    dao.loadById(post.id, 'article', function(err, article) {
        if(util.isError(err) || article == null) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/articles/manage_articles', cb);
            return;
        }
        
        //TODO should we keep track of contributors (users who edit)?
        post['author']      = article['author'];
        post = pb.DocumentCreator.formatIntegerItems(post, ['draft']);
        pb.DocumentCreator.update(post, article, ['meta_keywords', 'article_sections', 'article_topics', 'article_media']);
        self.setFormFieldValues(post);
        
        pb.RequestHandler.urlExists(article.url, post.id, function(error, exists) {
            if(error != null || exists || article.url.indexOf('/admin') == 0) {
                self.formError(self.ls.get('EXISTING_URL'), '/admin/content/articles/edit_article?id=' + get.id, cb);
                return;
            }
        
            dao.update(article).then(function(result) {
                if(util.isError(result)) {
                    self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/articles/edit_article?id=' + get.id, cb);
                    return;
                }
                
                self.session.success = article.headline + ' ' + self.ls.get('EDITED');
                delete self.session.fieldValues;
                self.redirect(pb.config.siteRoot + '/admin/content/articles/manage_articles', cb);
            });
        });
    });
};

EditArticle.prototype.getRequiredFields = function() {
	return ['url', 'headline', 'template', 'article_layout', 'id'];
};

//exports
module.exports = EditArticle;
