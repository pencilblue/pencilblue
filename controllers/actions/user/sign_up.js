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
                var userDocument = createDocument('user', post);
                
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
                uniqueID(function(verificationCode)
                {
                    post['verification_code'] = verificationCode;
                
                    var unverifiedUserDocument = createDocument('unverified_user', post);
                    
                    getDBObjectsWithValues({object_type: 'user', username: unverifiedUserDocument['username']}, function(data)
                    {
                        if(data.length > 0)
                        {
                            formError(request, session, '^loc_EXISTING_USERNAME^', '/user/sign_up', output);
                            return;
                        }
                        
                        getDBObjectsWithValues({object_type: 'user', email: unverifiedUserDocument['email']}, function(data)
                        {
                            if(data.length > 0)
                            {
                                formError(request, session, '^loc_EXISTING_EMAIL^', '/user/sign_up', output);
                                return;
                            }
                            
                            getDBObjectsWithValues({object_type: 'unverified_user', username: unverifiedUserDocument['username']}, function(data)
                            {
                                if(data.length > 0)
                                {
                                    if(data[0].email != unverifiedUserDocument['email'])
                                    {
                                        formError(request, session, '^loc_EXISTING_USERNAME^', '/user/sign_up', output);
                                        return;
                                    }
                                }
                                
                                getDBObjectsWithValues({object_type: 'unverified_user', email: unverifiedUserDocument['email']}, function(data)
                                {
                                    if(data.length > 0)
                                    {
                                        editDBObject(data[0]._id, unverifiedUserDocument, [], function(data)
                                        {
                                            if(data.length == 0)
                                            {
                                                formError(request, session, '^loc_ERROR_SAVING^', '/user/sign_up', output);
                                                return;
                                            }
                                            
                                            instance.sendVerificationEmail(unverifiedUserDocument);
                                            
                                            session.success = '^loc_VERIFICATION_SENT^' + unverifiedUserDocument.email;
                                            output({redirect: pb.config.siteRoot + '/user/verification_sent'});
                                        });
                                        return;
                                    }
                                    
                                    createDBObject(unverifiedUserDocument, function(data)
                                    {
                                        if(data.length == 0)
                                        {
                                            formError(request, session, '^loc_ERROR_SAVING^', '/user/sign_up', output);
                                            return;
                                        }
                                        
                                        instance.sendVerificationEmail(unverifiedUserDocument);
                                            
                                        session.success = '^loc_VERIFICATION_SENT^' + unverifiedUserDocument.email;
                                        output({redirect: pb.config.siteRoot + '/user/verification_sent'});
                                    });
                                });
                            });
                        });
                    });
                });
            }
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
