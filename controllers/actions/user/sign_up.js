/*

    Creates an unverified user and sends a confirmation email
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{ 
    getSession(request, function(session)
    {    
        var post = getPostParameters(request);
        
        post['photo'] = null;
        post['admin'] = 0;
        
        if(message = checkForRequiredParameters(post, ['username', 'email', 'password', 'confirm_password']))
        {
            formError(request, session, message, '/user/sign_up', output);
            return;
        }
        
        getContentSettings(function(contentSettings)
        {
            if(!contentSettings.require_verification)
            {
                var userserDocument = createDocument('user', post);
                
                getDBObjectsWithValues({object_type: 'user', username: userDocument['username']}, function(data)
                {
                    if(data.length > 0)
                    {
                        formError(request, session, '^loc_EXISTING_USERNAME^', '/user/sign_up', output);
                        return;
                    }
                    
                    getDBObjectsWithValues({object_type: 'user', email: userDocument['email']}, function(data)
                    {
                        if(data.length > 0)
                        {
                            formError(request, session, '^loc_EXISTING_EMAIL^', '/user/sign_up', output);
                            return;
                        }
                    
                        createDBObject(userDocument, function(data)
                        {
                            if(data.length == 0)
                            {
                                formError(request, session, '^loc_ERROR_SAVING^', '/user/sign_up', output);
                                return;
                            }
                            
                            session.success = '^loc_ACCOUNT_CREATED^';
                            editSession(request, session, [], function(data)
                            {        
                                output({redirect: pb.config.siteRoot + '/user/login'});
                            });
                        });
                    });
                });
            }
            else
            {
                
            }
        });
    });
}
