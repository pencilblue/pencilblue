// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({content: ''});
            return;
        }
        
        var get = getQueryParameters(request);
        if(!get['id'])
        {
            instance.invalidIDProvided(request, session, output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'section', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                instance.invalidIDProvided(request, session, output);
                return;
            }
            
            var section = data[0];
        
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('admin/content/sections/edit_section', null, null, function(data)
                {
                    result = result.concat(data);
                    
                    result = result.split('^section_id^').join(section._id);
                    result = instance.setTextDefaults(result, section);
                    
                    instance.getParentOptions(section, function(parentsList)
                    {
                        result = result.split('^parent_options^').join(parentsList);
                        
                        instance.getEditorOptions(section, function(editorsList)
                        {
                            result = result.split('^editor_options^').join(editorsList);
                        
                            editSession(request, session, [], function(data)
                            {
                                output({cookie: getSessionCookie(session), content: localize(['admin', 'sections'], result)});
                            });
                        });
                    });
                });
            });
        });
    });
}

this.setTextDefaults = function(result, section)
{
    result = result.split('^section_name^').join(section.name);
    result = result.split('^section_description^').join(section.description);
    result = result.split('^section_keywords^').join(section.keywords.join(', '));
    
    return result;
}

this.getParentOptions = function(section, output)
{
    var sections = [];
    var parentsList = '';
    
    var instance = this;
    
    getDBObjectsWithValues({object_type: 'section', parent: null, $orderby: {name: 1}}, function(data)
    {
        if(data.length > 0)
        {
            for(var i = 0; i < data.length; i++)
            {
                if(ObjectID(section.parent).equals(data[i]._id))
                {
                    parentsList = parentsList.concat('<option value="' + data[i]._id + '" selected="selected">' + data[i].name + '</option>');
                    continue;
                }
                
                parentsList = parentsList.concat('<option value="' + data[i]._id + '">' + data[i].name + '</option>');
            }
        }
        
        output(parentsList);
    });
}

this.getEditorOptions = function(section, output)
{
    templatesList = '';    
    
    getDBObjectsWithValues({object_type: 'user', admin: {$gt: 1}}, function(data)
    {
        if(data.length > 0)
        {
            for(var i = 0; i < data.length; i++)
            {
                if(ObjectID(section.editor).equals(data[i]._id))
                {
                    templatesList = templatesList.concat('<option value="' + data[i]._id + '" selected="selected">' + data[i].first_name + ' ' + data[i].last_name + '</option>');
                    continue;
                }
                
                templatesList = templatesList.concat('<option value="' + data[i]._id + '">' + data[i].first_name + ' ' + data[i].last_name + '</option>');
            }
            output(templatesList);
        }
        else
        {
            output('');
        }
    });
}

this.invalidIDProvided = function(request, session, output)
{
    session.section = 'sections';
    session.subsection = 'section_map';
    editSession(request, session, [], function(data)
    {
        output({cookie: getSessionCookie(session), content: getJSTag('window.location = "' + pb.config.siteRoot + '/admin/content/sections";')});
    });
}
