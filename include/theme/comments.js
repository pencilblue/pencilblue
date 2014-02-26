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
    return {photo: user.photo, name: (user.first_name) ? user.first_name + ' ' + user.last_name : user.username, position: user.position};
};

//exports
module.exports = CommentService;
