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
        
        if(!userIsAuthorized(session, {logged_in: true}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/user/manage_account', output);
            return;
        }
        if(message = checkForRequiredParameters(post, ['old_password', 'password', 'confirm_password']))
        {
            formError(request, session, message, '/user/manage_account', output);
            return;
        }
        
        var searchObject = createDocument('user', {_id: session.user._id, password: post['old_password']});        
        delete post['old_password'];
        
        getDBObjectsWithValues(searchObject, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_INVALID_PASSWORD^', '/user/manage_account', output);
                return;
            }
            
            var userDocument = createDocument('user', post);
            var user = data[0];
            user.password = userDocument['password'];
            
            editDBObject(user._id, user, [], function(data)
            {
                if(data.length == 0)
                {
                    formError(request, session, '^loc_ERROR_SAVING^', '/user/manage_account', output);
                    return;
                }
                
                session.success = '^loc_PASSWORD_CHANGED^';
                editSession(request, session, [], function(data)
                {        
                    output({redirect: pb.config.siteRoot + '/user/manage_account'});
                });
            });
        });
    });
}
