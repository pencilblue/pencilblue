/*

    Deletes a site section
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var instance = this;

    getSession(request, function(session)
    {
        if(!!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/sections', output);
            return;
        }
        
        var get = getQueryParameters(request);
        
        if(message = checkForRequiredParameters(get, ['id']))
        {
            formError(request, session, message, '/admin/content/sections', output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'section', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/sections', output);
                return;
            }
            
            deleteMatchingDBObjects({object_type: 'section', $or: [{_id: ObjectID(get['id'])}, {parent: get['id']}]}, function(success)
            {
                session.success = '^loc_SECTION_DELETED^';
                
                instance.updateSectionMap(get['id'], function(data)
                {
                    editSession(request, session, [], function(data)
                    {        
                        output({redirect: SITE_ROOT + '/admin/content/sections'});
                    });
                });
            });
        });
    });
}

this.updateSectionMap = function(removeID, output)
{
    getDBObjectsWithValues({object_type: 'setting', key: 'section_map'}, function(data)
    {
        if(data.length == 0)
        {
            output();
            return;
        }
        
        var sectionMap = data[0].value;
        
        for(var i = 0; i < sectionMap.length; i++)
        {
            if(sectionMap[i].uid == removeID)
            {
                sectionMap.splice(i, 1);
                break;
            }
            
            for(var j = 0; j < sectionMap[i].children.length; j++)
            {
                if(sectionMap[i].children[j].uid == removeID)
                {
                    sectionMap[i].children.splice(j, 1);
                    break;
                }
            }
        }
        
        var settingDocument = createDocument('setting', {key: 'section_map', value: sectionMap});
        editDBObject(data[0]._id, settingDocument, [], function(data)
        {
            output();
        });
    });
}
