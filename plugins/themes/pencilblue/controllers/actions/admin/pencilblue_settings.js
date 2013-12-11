/*

    Saves pencilblue theme settings
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/plugins/themes', output);
            return;
        }
    
        var post = getPostParameters(request);
        
        post['site_logo'] = post['uploaded_image'];
        
        delete post['uploaded_image'];
        delete post['media_search'];
        delete post['logo_url'];
        
        if(message = checkForRequiredParameters(post, ['site_logo', 'carousel_media']))
        {
            formError(request, session, message, '/admin/plugins/themes', output);
            return;
        }
        
        var pencilblueSettingsDocument = createDocument('pencilblue_theme_settings', post, ['carousel_media']);
        
        getDBObjectsWithValues({object_type: 'pencilblue_theme_settings'}, function(data)
        {
            if(data.length > 0)
            {
                editDBObject(data[0]._id, pencilblueSettingsDocument, [], function(data)
                {
                    if(data.length == 0)
                    {
                        formError(request, session, '^loc_ERROR_SAVING^', '/admin/plugins/themes', output);
                        return;
                    }
                    
                    session.success = '^loc_PENCILBLUE_SETTINGS_SAVED^';
                    
                    editSession(request, session, [], function(data)
                    {        
                        output({redirect: pb.config.siteRoot + '/admin/plugins/themes'});
                    });
                });
                return;
            }
            
            createDBObject(pencilblueSettingsDocument, function(data)
            {
                if(data.length == 0)
                {
                    formError(request, session, '^loc_ERROR_SAVING^', '/admin/plugins/themes', output);
                    return;
                }
                
                session.success = '^loc_PENCILBLUE_SETTINGS_SAVED^';
                
                editSession(request, session, [], function(data)
                {        
                    output({redirect: pb.config.siteRoot + '/admin/plugins/themes'});
                });
            });
        });
    });
}
