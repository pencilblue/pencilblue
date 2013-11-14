// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    getDBObjectsWithValues({object_type: 'user'}, function(data)
    {
        if(data.length > 0)
        {
            output({redirect: SITE_ROOT});
            return;
        }
    
        getSession(request, function(session)
        {        
            var post = getPostParameters(request);
            
            if(message = checkForRequiredParameters(post, ['username', 'email', 'password', 'confirm_password']))
            {
                formError(request, session, message, '/setup', output);
                return;
            }
            
            post['admin'] = 4;
            var userDocument = createDocument('user', post);
            
            createDBObject(userDocument, function(data)
            {
                if(data.length == 0)
                {
                    formError(request, session, '^loc_ERROR_SAVING^', '/setup', output);
                    return;
                }
                
                session.success = '^loc_READY_TO_USE^';
                editSession(request, session, [], function(data)
                {        
                    output({redirect: SITE_ROOT + '/admin/login'});
                });
            });
        });
    });
}
