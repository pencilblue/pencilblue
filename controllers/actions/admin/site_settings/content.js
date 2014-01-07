/*

    Saves content settings
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/

this.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_ADMINISTRATOR}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/site_settings', output);
            return;
        }
    
        var post = getPostParameters(request);
        
        if(message = checkForRequiredParameters(post, ['articles_per_page']))
        {
            formError(request, session, message, '/admin/site_settings', output);
            return;
        }
        
        session = setFormFieldValues(post, session);
        
        var settings = {key: 'content_settings', value: post};
        var settingsDocument = createDocument('setting', settings);
        
        getDBObjectsWithValues({object_type: 'setting', key: 'content_settings'}, function(data)
        {
            if(data.length > 0)
            {
                editDBObject(data[0]._id, settingsDocument, [], function(data)
                {
                    if(data.length == 0)
                    {
                        formError(request, session, '^loc_ERROR_SAVING^', '/admin/site_settings', output);
                        return;
                    }
                    
                    session.success = '^loc_CONTENT_SETTINGS^ ^loc_EDITED^';
                    delete session.fieldValues;
                    editSession(request, session, [], function(data)
                    {        
                        output({redirect: pb.config.siteRoot + '/admin/site_settings'});
                    });
                });
                return;
            }
            
            createDBObject(settingsDocument, function(data)
            {
                if(data.length == 0)
                {
                    formError(request, session, '^loc_ERROR_SAVING^', '/admin/site_settings', output);
                    return;
                }
                
                session.success = '^loc_CONTENT_SETTINGS^ ^loc_CREATED^';
                delete session.fieldValues;
                editSession(request, session, [], function(data)
                {        
                    output({redirect: pb.config.siteRoot + '/admin/site_settings'});
                });
            });
        });
    });
}
