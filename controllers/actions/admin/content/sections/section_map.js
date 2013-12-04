/*

    Saves a reorganized section map
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!userIsAuthorized({logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/sections', output);
            return;
        }
    
        var post = getPostParameters(request);
        
        if(message = checkForRequiredParameters(post, ['map']))
        {
            formError(request, session, message, '/admin/content/sections', output);
            return;
        }
        
        var sectionMap = JSON.parse(decodeURIComponent(post['map']));
        if(!sectionMap[0].uid)
        {
            formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/sections', output);
            return;
        }
        
        var settingDocument = createDocument('setting', {key: 'section_map', value: sectionMap});
        
        getDBObjectsWithValues({object_type: 'setting', key: 'section_map'}, function(data)
        {
            if(data.length > 0)
            {
                editDBObject(data[0]._id, settingDocument, [], function(data)
                {
                    if(data.length == 0)
                    {
                        formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/sections', output);
                        return;
                    }
                    
                    session.success = '^loc_SECTION_MAP_SAVED^';
                    editSession(request, session, [], function(data)
                    {        
                        output({redirect: SITE_ROOT + '/admin/content/sections'});
                    });
                });
                return;
            }
            
            createDBObject(settingDocument, function(data)
            {
                if(data.length == 0)
                {
                    formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/sections', output);
                    return;
                }
                
                session.success = '^loc_SECTION_MAP_SAVED^';
                editSession(request, session, [], function(data)
                {        
                    output({redirect: SITE_ROOT + '/admin/content/sections'});
                });
            });
        });
    });
}
