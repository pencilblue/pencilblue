this.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({redirect: SITE_ROOT});
            return;
        }
        
        var get = getQueryParameters(request);
        var post = getPostParameters(request);
        
        if(message = checkForRequiredParameters(post, ['name', 'editor']))
        {
            formError(request, session, message, '/admin/content/sections', output);
            return;
        }
        if(message = checkForRequiredParameters(get, ['id']))
        {
            formError(request, session, message, '/admin/content/sections', output);
            return;
        }
        if(session['user']['admin'] < 3)
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/sections', output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'section', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/sections', output);
                return;
            }
            
            var section = data[0];
            var sectionDocument = createDocument('section', post, ['keywords'], ['parent']);
            
            getDBObjectsWithValues({object_type: 'section', name: sectionDocument['name']}, function(data)
            {
                if(data.length > 0)
                {
                    if(!data[0]._id.equals(section._id))
                    {
                        formError(request, session, '^loc_EXISTING_SECTION^', '/admin/content/sections', output);
                        return;
                    }
                }
                
                editDBObject(section._id, sectionDocument, [], function(data)
                {
                    if(data.length == 0)
                    {
                        formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/sections', output);
                        return;
                    }
                    
                    session.success = '^loc_SECTION_EDITED^';
                    editSession(request, session, [], function(data)
                    {        
                        output({redirect: SITE_ROOT + '/admin/content/sections'});
                    });
                });
            });
        });
    });
}
