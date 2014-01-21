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
        
        post['photo'] = post['uploaded_image'];
        
        delete post['uploaded_image'];
        delete post['image_url'];
        
        if(message = checkForRequiredParameters(post, ['username', 'email', 'password', 'confirm_password', 'admin']))
        {
            formError(request, session, message, '/admin/users/new_user', output);
            return;
        }
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}) || session['user']['admin'] < post['admin'])
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/users/new_user', output);
            return;
        }
        
        var userDocument = createDocument('user', post);
        
        getDBObjectsWithValues({object_type: 'user', username: userDocument['username']}, function(data)
        {
            if(data.length > 0)
            {
                formError(request, session, '^loc_EXISTING_USERNAME^', '/admin/users/new_user', output);
                return;
            }
            
            getDBObjectsWithValues({object_type: 'user', email: userDocument['email']}, function(data)
            {
                if(data.length > 0)
                {
                    formError(request, session, '^loc_EXISTING_EMAIL^', '/admin/users/new_user', output);
                    return;
                }
            
                createDBObject(userDocument, function(data)
                {
                    if(data.length == 0)
                    {
                        formError(request, session, '^loc_ERROR_SAVING^', '/admin/users/new_user', output);
                        return;
                    }
                    
                    session.success = '^loc_USER_CREATED^';
                    editSession(request, session, [], function(data)
                    {        
                        output({redirect: pb.config.siteRoot + '/admin/users/manage_users'});
                    });
                });
            });
        });
    });
}
