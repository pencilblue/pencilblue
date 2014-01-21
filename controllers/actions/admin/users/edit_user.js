/*

    Edit a user
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    getSession(request, function(session)
    {    
        var get = getQueryParameters(request);
        var post = getPostParameters(request);
        
        post['photo'] = post['uploaded_image'];
        
        delete post['uploaded_image'];
        delete post['image_url'];
        
        if(message = checkForRequiredParameters(post, ['username', 'email', 'admin']))
        {
            formError(request, session, message, '/admin/users/manage_users', output);
            return;
        }
        if(message = checkForRequiredParameters(get, ['id']))
        {
            formError(request, session, message, '/admin/users/manage_users', output);
            return;
        }
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}) || session['user']['admin'] < post['admin'])
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/users/manage_users', output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'user', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_ERROR_SAVING^', '/admin/users/manage_users', output);
                return;
            }
            
            var userDocument = createDocument('user', post);
            
            getDBObjectsWithValues({object_type: 'user', username: userDocument['username']}, function(data)
            {
                if(data.length > 0)
                {
                    if(!data[0]._id.equals(ObjectID(get['id'])))
                    {
                        formError(request, session, '^loc_EXISTING_USERNAME^', '/admin/users/edit_user?id=' + get['id'], output);
                        return;
                    }
                }
                
                var user = data[0];
                
                getDBObjectsWithValues({object_type: 'user', email: userDocument['email']}, function(data)
                {
                    if(data.length > 0)
                    {
                        if(!data[0]._id.equals(user._id))
                        {
                            formError(request, session, '^loc_EXISTING_EMAIL^', '/admin/users/edit_user?id=' + get['id'], output);
                            return;
                        }
                    }
                
                    editDBObject(user._id, userDocument, ['password'], function(data)
                    {
                        if(data.length == 0)
                        {
                            formError(request, session, '^loc_ERROR_SAVING^', '/admin/users/edit_user?id=' + get['id'], output);
                            return;
                        }
                        
                        session.success = '^loc_USER_EDITED^';
                        editSession(request, session, [], function(data)
                        {        
                            output({redirect: pb.config.siteRoot + '/admin/users/manage_users'});
                        });
                    });
                });
            });
        });
    });
}
