this.init = function(request, output)
{
    var instance = this;
 
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({redirect: SITE_ROOT});
            return;
        }
    
        var post = getPostParameters(request);
        output({content: JSON.stringify(post)});
        return;
        
        if(message = instance.postErrorCheck(post))
        {
            instance.formError(request, session, message, output);
            return;
        }
        if(session['user']['admin'] < 1)
        {
            instance.formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', output);
            return;
        }
        
        if(!post['sections[]'])
        {
            post['sections[]'] = [];
        }
        
        getDBObjectsWithValues({object_type: 'article', url: post['url']}, function(data)
        {
            if(data.length > 0)
            {
                instance.formError(request, session, '^loc_EXISTING_URL^', output);
                return;
            }
            
            var meta_keywords = post['meta_keywords'].split(',');
            for(var i = 0; i < meta_keywords.length; i++)
            {
                meta_keywords[i] = meta_keywords[i].trim();
            }
            
            createDBObject({object_type: 'article', url: post['url'], template: post['template'], headline: post['headline'], subheading: post['subheading'], publish_date: post['publish_date']}, function(data)
            {
                if(data.length == 0)
                {
                    instance.formError(request, session, '^loc_ERROR_SAVING^', output);
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

this.postErrorCheck = function(post)
{
    if(!post['url'] || !post['template'] || !post['content'])
    {
        return '^loc_FORM_INCOMPLETE^';
    }
    
    return false;
}

this.formError = function(request, session, message, output)
{
    session.error = message;
    editSession(request, session, [], function(data)
    {        
        output({redirect: SITE_ROOT + '/admin/content/articles'});
    });
}
