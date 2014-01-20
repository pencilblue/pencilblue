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
