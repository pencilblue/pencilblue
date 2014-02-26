/**
 * NewArticle - Creates a new article
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewArticle(){}

//inheritance
util.inherits(NewArticle, pb.FormController);

NewArticle.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	
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

    post['author']       = this.session.authentication.user_id;
    post['publish_date'] = new Date(post['publish_date']);
    
    this.setFormFieldValues(post);
    
    var message = this.hasRequiredParams(post, this.getRequiredFields());
    if(message) {
        this.formError(message, '/admin/content/articles/new_article', cb);
        return;
    }
    
    var articleDocument = pb.DocumentCreator.create('article', post, ['meta_keywords', 'article_sections', 'article_topics', 'article_media']);
    console.log('here');
    pb.RequestHandler.isSystemSafeURL(articleDocument.url, null, function(err, isSafe) {console.log('here2');
        if(util.isError(err) || !isSafe)  {
            self.formError('^loc_EXISTING_URL^', '/admin/content/articles/new_article', cb);
            return;
        }
    
        var dao = new pb.DAO();
        dao.update(articleDocument).then(function(result) {
            if(util.isError(result))  {
                self.formError('^loc_ERROR_SAVING^', '/admin/content/articles/new_article', cb);
                return;
            }
            
            self.session.success = articleDocument.headline + ' ^loc_CREATED^';
            delete self.session.fieldValues;
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/articles/manage_articles'));
        });
    });
};

NewArticle.prototype.getRequiredFields = function() {
	return ['url', 'headline', 'template', 'article_layout'];
};

//exports
module.exports = NewArticle;
