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
        if(session['user']['admin'] < post['admin'])
        {
            instance.formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', output);
            return;
        }
        
        var whirlpool = require('crypto').createHash('whirlpool');
        whirlpool.update(post.password);
        var hashedPassword = whirlpool.digest('hex');
        
        getDBObjectsWithValues({object_type: 'user', username: post['username']}, function(data)
        {
            if(data.length > 0)
            {
                instance.formError(request, session, '^loc_EXISTING_USERNAME^', output);
                return;
            }
            
            getDBObjectsWithValues({object_type: 'user', email: post['email']}, function(data)
            {
                if(data.length > 0)
                {
                    instance.formError(request, session, '^loc_EXISTING_EMAIL^', output);
                    return;
                }
            
                createDBObject({object_type: 'user', username: post['username'], first_name: post['first_name'], last_name: post['last_name'], email: post['email'], admin: parseInt(post['admin']), password: hashedPassword}, function(data)
                {
                    if(data.length == 0)
                    {
                        instance.formError(request, session, '^loc_ERROR_SAVING^', output);
                        return;
                    }
                    
                    session.success = '^loc_USER_CREATED^';
                    editSession(request, session, [], function(data)
                    {        
                        output({redirect: SITE_ROOT + '/admin/users/new_user'});
                    });
                });
            });
        });
    });
}

this.postErrorCheck = function(post)
{
    if(!post['username'] || !post['email'] || !post['password'] || !post['confirm_password'] || typeof post['admin'] == 'undefined')
    {
        return '^loc_FORM_INCOMPLETE^';
    }
    if(post['password'] != post['confirm_password'])
    {
        return '^loc_PASSWORD_MISMATCH^';
    }
    
    return false;
}

this.formError = function(request, session, message, output)
{
    session.error = message;
    editSession(request, session, [], function(data)
    {        
        output({redirect: SITE_ROOT + '/admin/users/new_user'});
    });
}
