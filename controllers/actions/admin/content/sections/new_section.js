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
    
        var post = getPostParameters(request.headers['post']);
        
        if(message = instance.postErrorCheck(post))
        {
            instance.formError(request, session, message, output);
            return;
        }
        if(session['user']['admin'] < 3)
        {
            instance.formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'section', name: post['name']}, function(data)
        {
            if(data.length > 0)
            {
                instance.formError(request, session, '^loc_EXISTING_SECTION^', output);
                return;
            }
            
            createDBObject({object_type: 'section', name: post['name'], description: post['description'], parent: post['parent'], editor: post['editor'], keywords: post['keywords']}, function(data)
            {
                if(data.length == 0)
                {
                    instance.formError(request, session, '^loc_ERROR_SAVING^', output);
                    return;
                }
                
                session.success = '^loc_SECTION_CREATED^';
                editSession(request, session, [], function(data)
                {        
                    output({redirect: SITE_ROOT + '/admin/content/sections/new_section'});
                });
            });
        });
    });
}

this.postErrorCheck = function(post)
{
    if(!post['name'] || !post['editor'])
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
        output({redirect: SITE_ROOT + '/admin/content/sections/new_section'});
    });
}
