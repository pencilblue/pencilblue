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
        
        session.section = 'sections';
        session.subsection = 'new_section';
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/content/sections/new_section', null, null, function(data)
            {
                result = result.concat(data);
                instance.getEditorOptions(session, function(editorsList)
                {
                    result = result.split('^editor_options^').join(editorsList);
                
                    editSession(request, session, [], function(data)
                    {
                        output({content: localize(['admin', 'sections'], result)});
                    });
                });
            });
        });
    });
}

this.getEditorOptions = function(session, output)
{
    templatesList = '';    
    
    getDBObjectsWithValues({object_type: 'user', $or: [{admin: "2"}, {admin: "3"}]}, function(data)
    {
        if(data.length > 0)
        {
            for(var i = 0; i < data.length; i++)
            {
                if(session['user']._id.equals(data[i]._id))
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
