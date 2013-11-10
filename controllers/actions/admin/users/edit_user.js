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
    
        var get = getQueryParameters(request);
        var post = getPostParameters(request);
        
        if(message = instance.postErrorCheck(post) || !get['id'])
        {
            instance.formError(request, session, message, output);
            return;
        }
        if(session['user']['admin'] < post['admin'])
        {
            instance.formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'user', _id: ObjectID(get['id'])}, function(data)
        {
        
            if(data.length == 0)
            {
                instance.formError(request, session, '^loc_ERROR_SAVING^', output);
                return;
            }
            
            var user = data[0];
            
            post['username'] = post['username'].toLowerCase();
            
            getDBObjectsWithValues({object_type: 'user', username: post['username']}, function(data)
            {
                if(data.length > 0)
                {
                    if(!data[0]._id.equals(user._id))
                    {
                        instance.formError(request, session, '^loc_EXISTING_USERNAME^', output);
                        return;
                    }
                }
                
                post['email'] = post['email'].toLowerCase();
                
                getDBObjectsWithValues({object_type: 'user', email: post['email']}, function(data)
                {
                    if(data.length > 0)
                    {
                        if(!data[0]._id.equals(user._id))
                        {
                            instance.formError(request, session, '^loc_EXISTING_EMAIL^', output);
                            return;
                        }
                    }
                
                    editDBObject(user._id, {object_type: 'user', username: post['username'], first_name: post['first_name'], last_name: post['last_name'], email: post['email'], admin: parseInt(post['admin'])}, ['password'], function(data)
                    {
                        if(data.length == 0)
                        {
                            instance.formError(request, session, '^loc_ERROR_SAVING^', output);
                            return;
                        }
                        
                        session.success = '^loc_USER_EDITED^';
                        editSession(request, session, [], function(data)
                        {        
                            output({redirect: SITE_ROOT + '/admin/users'});
                        });
                    });
                });
            });
        });
    });
}

this.postErrorCheck = function(post)
{
    if(!post['username'] || !post['email'] || typeof post['admin'] == 'undefined')
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
        output({redirect: SITE_ROOT + '/admin/users'});
    });
}
