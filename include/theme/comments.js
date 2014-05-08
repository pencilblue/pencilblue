/**
 * CommentService - 
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.
 */
function CommentService(){}

CommentService.getCommentsTemplates = function(contentSettings, output) {
    var self = this;

    if(!contentSettings.allow_comments) {
        output('');
        return;
    }

    //TODO move this out of here.
    var ts = new pb.TemplateService();
    ts.load('elements/comments', function(err, commentsContainer) {
        ts.load('elements/comments/comment', function(err, comment) {
            output({commentsContainer: commentsContainer, comment: comment});
        });
    });
};

CommentService.getCommentingUser = function(user) {
    return {
    	photo: user.photo, 
    	name: pb.users.getFormattedName(user), 
    	position: user.position
	};
};

//exports
module.exports = CommentService;
