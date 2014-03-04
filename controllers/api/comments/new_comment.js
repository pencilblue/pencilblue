/**
 * NewComment - Controller to add a comment
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewComment(){}

//dependencies
var BaseController = pb.BaseController;

//inheritance
util.inherits(NewComment, pb.FormController);

NewComment.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	
	pb.content.getSettings(function(err, contentSettings) {
		if(!contentSettings.allow_comments) {
            cb({content: BaseController.apiResponse(BaseController.API_FAILURE, 'commenting not allowed'), code: 400});
            return;
        }
        
		var message = self.hasRequiredParams(post, ['article', 'content']);
        if (message) {
        	cb({content: BaseController.apiResponse(BaseController.API_FAILURE, 'parameters missing'), code: 400});
            return;
        }
        
        var dao = new pb.DAO();
        dao.loadById(post.article, 'article', function(err, article) {
            if(util.isError(err) || article == null) {
            	cb({content: BaseController.apiResponse(BaseController.API_FAILURE, 'article does not exist'), code: 400});
                return;
            }
            
            var commentDocument       = pb.DocumentCreator.create('comment', post);
            commentDocument.commenter = self.session.authentication.user_id;
            
            dao.update(commentDocument).then(function(data) {
                if (util.isError(data)) {
                	cb({content: BaseController.apiResponse(BaseController.API_FAILURE, 'error saving'), code: 500});
                    return;
                }

                var timestamp  = pb.content.getTimestampText(commentDocument.created, contentSettings.date_format, contentSettings.display_hours_minutes, contentSettings.time_format);
                commentDocument.timestamp = self.localizationService.localize(['timestamp'], timestamp);
				cb({content: BaseController.apiResponse(BaseController.API_SUCCESS, 'comment created' , commentDocument)});
            });
        });
	});
};

//exports
module.exports = NewComment;
