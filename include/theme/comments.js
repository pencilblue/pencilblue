this.getCommentsTemplate = function(contentSettings, output)
{
    if(!contentSettings.allow_comments)
    {
        output('');
        return;
    }

    getHTMLTemplate('elements/comments', null, null, function(data)
    {
        output(data);
    });
}

this.getCommentingUser = function(user)
{
    return {photo: user.photo, name: (user.first_name) ? user.first_name + ' ' + user.last_name : user.username, position: user.position};
}
