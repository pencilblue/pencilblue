// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var instance = this;
    
    getDBObjectsWithValues({object_type: 'user'}, function(data)
    {
        if(data.length > 0)
        {
            output({redirect: pb.config.siteRoot});
            return;
        }
    
        getSession(request, function(session)
        {        
            var post = getPostParameters(request);
            
            if(message = checkForRequiredParameters(post, ['username', 'email', 'password', 'confirm_password']))
            {
                formError(request, session, message, '/setup', output);
                return;
            }
            
            post['admin'] = 4;
            var userDocument = createDocument('user', post);
            
            createDBObject(userDocument, function(data)
            {
                if(data.length == 0)
                {
                    formError(request, session, '^loc_ERROR_SAVING^', '/setup', output);
                    return;
                }
                
                var settingDocument = createDocument('setting', {key: 'active_theme', value: 'pencilblue'});
                createDBObject(settingDocument, function(data)
                {
                    if(data.length == 0)
                    {
                        formError(request, session, '^loc_ERROR_SAVING^', '/setup', output);
                        return;
                    }
                    
                    settingDocument = createDocument('setting', {key: 'content_settings', value: instance.getDefaultContentSettings()});
                    createDBObject(settingDocument, function(data)
                    {
                        if(data.length == 0)
                        {
                            formError(request, session, '^loc_ERROR_SAVING^', '/setup', output);
                            return;
                        }
                    
                        session.success = '^loc_READY_TO_USE^';
                        editSession(request, session, [], function(data)
                        {        
                            output({redirect: pb.config.siteRoot + '/admin/login'});
                        });
                    });
                });
            });
        });
    });
}

this.getDefaultContentSettings = function()
{
    defaultContentSettings =
    {
        articles_per_page: 5,
        auto_break_articles: 0,
        display_timestamp: 1,
        date_format: 'Month dd, YYYY',
        display_hours_minutes: 1,
        time_format: '12',
        display_bylines: 1,
        display_writer_photo: 1,
        display_writer_position: 1,
        allow_comments: 1,
        default_comments: 1
    }
    
    return defaultContentSettings;
}
