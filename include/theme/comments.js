/**
 * CommentService - 
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.
 */
function CommentService(){}

CommentService.getCommentsTemplate = function(contentSettings, output) {
    if(!contentSettings.allow_comments) {
        output('');
        return;
    }

    pb.templates.load('elements/comments', null, null, function(data) {
        output(data);
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
