this.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({redirect: pb.config.siteRoot});
            return;
        }
    
        var post = getPostParameters(request);
        delete post['topic_search'];
        
        if(message = checkForRequiredParameters(post, ['media_type', 'location', 'caption']))
        {
            formError(request, session, message, '/admin/content/media', output);
            return;
        }
        if(session['user']['admin'] < 1)
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/media', output);
            return;
        }
        
        var mediaDocument = createDocument('media', post, ['media_topics'], ['is_file']);
        
        createDBObject(mediaDocument, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/media', output);
                return;
            }
                    
            output({content: JSON.stringify(data)});
        });
    });
}
