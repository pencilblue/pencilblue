/*

    Edit a user
    
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
        
        if(!userIsAuthorized(session, {logged_in: true}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/user/manage_account', output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'user', _id: session.user._id}, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_ERROR_SAVING^', '/user/manage_account', output);
                return;
            }
            
            var user = data[0];
            
            for(var key in post)
            {
                session.user[key] = post[key];
                user[key] = post[key];
            }
            
            editDBObject(user._id, user, [], function(data)
            {
                if(data.length == 0)
                {
                    formError(request, session, '^loc_ERROR_SAVING^', '/user/manage_account', output);
                    return;
                }
                
                session.success = '^loc_PROFILE_EDITED^';
                editSession(request, session, [], function(data)
                {        
                    output({redirect: pb.config.siteRoot + '/user/manage_account'});
                });
            });
        });
    });
}
