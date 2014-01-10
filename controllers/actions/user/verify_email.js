/*

    Creates a user and sends a confirmation email, if necessary
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{ 
    var instance = this;

    getSession(request, function(session)
    {    
        var get = getQueryParameters(request);
        
        if(checkForRequiredParameters(get, ['email', 'code']))
        {
            formError(request, session, '^loc_INVALID_VERIFICATION^', '/user/resend_verification', output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'user', email: get['email']}, function(data)
        {
            if(data.length > 0)
            {
                formError(request, session, '^loc_USER_VERIFIED^', '/user/login', output);
                return;
            }
            
            getDBObjectsWithValues({object_type: 'unverified_user', email: get['email']}, function(data)
            {
                if(data.length == 0)
                {
                    formError(request, session, '^loc_NOT_REGISTERED^', '/user/sign_up', output);
                    return;
                }
                
                var unverifiedUser = data[0];
                
                if(unverifiedUser['verification_code'] != get['code'])
                {
                    formError(request, session, '^loc_INVALID_VERIFICATION^', '/user/resend_verification', output);
                    return;
                }
                
                deleteMatchingDBObjects({object_type: 'unverified_user', _id: unverifiedUser._id}, function(success)
                {
                    var user = unverifiedUser;
                
                    delete user._id;
                    delete user.created;
                    delete user.last_modified;
                    user.object_type = 'user';
                    
                    createDBObject(user, function(data)
                    {
                        if(data.length == 0)
                        {
                            formError(request, session, '^loc_ERROR_SAVING^', '/user/sign_up', output);
                            return;
                        }
                        
                        session.success = '^loc_EMAIL_VERIFIED^';
                        output({redirect: pb.config.siteRoot + '/user/login'});
                    });
                });
            });
        });
    });
}
