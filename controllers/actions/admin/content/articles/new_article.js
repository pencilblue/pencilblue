this.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({redirect: SITE_ROOT});
            return;
        }
    
        var post = getPostParameters(request);
        
        if(message = checkForRequiredParameters(post, ['url', 'template', 'content']))
        {
            formError(request, session, message, '/admin/content/articles', output);
            return;
        }
        if(session['user']['admin'] < 3)
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/articles', output);
            return;
        }
        
        var articleDocument = createDocument('article', post, ['meta_keywords']);
        
        if(!articleDocument['sections[]'])
        {
            articleDocument['sections[]'] = [];
        }
        
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
                
                session.success = '^loc_SECTION_CREATED^';
                editSession(request, session, [], function(data)
                {        
                    output({redirect: SITE_ROOT + '/admin/content/articles'});
                });
            });
        });
    });
}
