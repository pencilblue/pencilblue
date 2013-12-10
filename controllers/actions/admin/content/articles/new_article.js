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
        
        if(message = checkForRequiredParameters(post, ['url', 'template', 'article_content']))
        {
            formError(request, session, message, '/admin/content/articles', output);
            return;
        }
        if(session['user']['admin'] < 1)
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/articles', output);
            return;
        }
        
        var articleDocument = createDocument('article', post, ['meta_keywords', 'article_sections', 'article_topics', 'article_media']);
        
        getDBObjectsWithValues({object_type: 'article', url: articleDocument['url']}, function(data)
        {
            if(data.length > 0)
            {
                formError(request, session, '^loc_EXISTING_URL^', '/admin/content/articles', output);
                return;
            }
            
            createDBObject(articleDocument, function(data)
            {
                if(data.length == 0)
                {
                    formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/articles', output);
                    return;
                }
                
                session.success = '^loc_ARTICLE_CREATED^';
                editSession(request, session, [], function(data)
                {        
                    output({redirect: pb.config.siteRoot + '/admin/content/articles'});
                });
            });
        });
    });
}
