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
        var post = getPostParameters(request);
        
        if(message = checkForRequiredParameters(post, ['email']))
        {
            formError(request, session, message, '/user/resend_verification', output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'user', email: post['email']}, function(data)
        {
            if(data.length > 0)
            {
                formError(request, session, '^loc_USER_VERIFIED^', '/user/resend_verification', output);
                return;
            }
            
            getDBObjectsWithValues({object_type: 'unverified_user', email: post['email']}, function(data)
            {
                if(data.length == 0)
                {
                    formError(request, session, '^loc_NOT_REGISTERED^', '/user/sign_up', output);
                    return;
                }
                
                var unverifiedUser = data[0];
                uniqueID(function(verificationCode)
                {
                    unverifiedUser['verification_code'] = verificationCode;
                    
                    editDBObject(unverifiedUser._id, unverifiedUser, [], function(data)
                    {
                        if(data.length == 0)
                        {
                            formError(request, session, '^loc_ERROR_SAVING^', '/user/resend_verification', output);
                            return;
                        }
                        
                        instance.sendVerificationEmail(unverifiedUser);
                        
                        session.success = '^loc_VERIFICATION_SENT^' + unverifiedUser.email;
                        output({redirect: pb.config.siteRoot + '/user/verification_sent'});
                    });
                });
            });
        });
    });
}

this.sendVerificationEmail = function(user)
{
    getEmailSettings(function(emailSettings)
    {
        emailBody = emailSettings.verification_content.split('^verification_url^').join(pb.config.siteRoot + '/user/verify_email?code=' + user.verification_code);;
        emailBody = emailBody.split('^first_name^').join(user.first_name);
        emailBody = emailBody.split('^last_name^').join(user.last_name);
        
        sendEmail(emailSettings.from_name + '<' + emailSettings.from_address + '>', user.email, emailSettings.verification_subject, emailBody);
    });
}
