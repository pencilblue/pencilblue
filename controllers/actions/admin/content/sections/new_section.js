this.init = function(request, output)
{
    var instance = this;

    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({redirect: pb.config.siteRoot});
            return;
        }
    
        var post = getPostParameters(request);
        
        if(message = checkForRequiredParameters(post, ['name', 'editor']))
        {
            formError(request, session, message, '/admin/content/sections', output);
            return;
        }
        if(session['user']['admin'] < 3)
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/sections', output);
            return;
        }
        
        var sectionDocument = createDocument('section', post, ['keywords'], ['parent']);
        
        getDBObjectsWithValues({object_type: 'section', name: sectionDocument['name']}, function(data)
        {
            if(data.length > 0)
            {
                formError(request, session, '^loc_EXISTING_SECTION^', '/admin/content/sections', output);
                return;
            }
            
            createDBObject(sectionDocument, function(data)
            {
                if(data.length == 0)
                {
                    formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/sections', output);
                    return;
                }
                
                session.success = '^loc_SECTION_CREATED^';
                
                instance.checkForSectionMap(sectionDocument, function()
                {                
                    editSession(request, session, [], function(data)
                    {        
                        output({redirect: pb.config.siteRoot + '/admin/content/sections'});
                    });
                });
            });
        });
    });
}

this.checkForSectionMap = function(sectionDocument, output)
{
    getDBObjectsWithValues({object_type: 'section', name: sectionDocument['name']}, function(data)
    {
        if(data.length == 0)
        {
            output();
            return;
        }
        
        var sectionUID = data[0]._id.toString();

        getDBObjectsWithValues({object_type: 'setting', key: 'section_map'}, function(data)
        {
            if(data.length == 0)
            {
                var settingDocument = createDocument('setting', {key: 'section_map', value: [{uid: sectionUID, children: []}]});
                createDBObject(settingDocument, function(data)
                {
                    output();
                });
                return;
            }
            
            var sectionMap = data[0].value;
            
            if(!sectionDocument['parent'])
            {
                sectionMap.push({uid: sectionUID, children: []});
            }
            else
            {
                for(var i = 0; i < sectionMap.length; i++)
                {
                    if(sectionMap[i].uid == sectionDocument['parent'])
                    {
                        sectionMap[i].children.push({uid: sectionUID});
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
    });
}
