/**
 * SaveDraft - Interface for saving a page draft
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function SaveDraft(){}

//inheritance
util.inherits(SaveDraft, pb.FormController);

SaveDraft.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var vars = this.pathVars;
    
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
    post['page_layout'] = decodeURIComponent(post['page_layout']);
    
    //add vars to post
    pb.utils.merge(vars, post);
    
    var message = this.hasRequiredParams(post, this.getRequiredFields());
    if (message) {
        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)});
        return;
    }
    
    var dao = new pb.DAO();
    dao.loadById(post.id, 'page', function(err, page) {
        if(util.isError(err) || page == null) {
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'invalid page id')});
            return;
        }
        
        //TODO should we keep track of contributors (users who edit)?
        post['author']      = page['author'];
        post = pb.DocumentCreator.formatIntegerItems(post, ['draft']);
        pb.DocumentCreator.update(post, page, ['meta_keywords', 'page_topics', 'page_media']);
        
        pb.RequestHandler.urlExists(page.url, post.id, function(error, exists) {
            if(error != null || exists || page.url.indexOf('/admin') == 0) {
                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'existing page url')});
                return;
            }
        
            dao.update(page).then(function(result) {
                if(util.isError(result)) {
                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'database error')});
                    return;
                }
                
                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'page updated', page)});
            });
        });
    });
};

SaveDraft.prototype.getRequiredFields = function() {
	return ['url', 'headline', 'template', 'page_layout', 'id'];
};

//exports
module.exports = SaveDraft;
