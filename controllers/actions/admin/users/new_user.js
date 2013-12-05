/*

    Add a new user
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{ 
    getSession(request, function(session)
    {    
        var post = getPostParameters(request);
        
        if(message = checkForRequiredParameters(post, ['username', 'email', 'password', 'confirm_password', 'admin']))
        {
            formError(request, session, message, '/admin/users', output);
            return;
        }
        if(!userIsAuthorized({logged_in: true, admin_level: ACCESS_EDITOR}) || session['user']['admin'] < post['admin'])
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/users', output);
            return;
        }
        
        var userDocument = createDocument('user', post);
        
        getDBObjectsWithValues({object_type: 'user', username: userDocument['username']}, function(data)
        {
            if(data.length > 0)
            {
                formError(request, session, '^loc_EXISTING_USERNAME^', '/admin/users', output);
                return;
            }
            
            getDBObjectsWithValues({object_type: 'user', email: userDocument['email']}, function(data)
            {
                if(data.length > 0)
                {
                    formError(request, session, '^loc_EXISTING_EMAIL^', '/admin/users', output);
                    return;
                }
            
                createDBObject(userDocument, function(data)
                {
                    if(data.length == 0)
                    {
                        formError(request, session, '^loc_ERROR_SAVING^', '/admin/users', output);
                        return;
                    }
                    
                    session.success = '^loc_USER_CREATED^';
                    editSession(request, session, [], function(data)
                    {        
                        output({redirect: SITE_ROOT + '/admin/users'});
                    });
                });
            });
        });
    });
}
