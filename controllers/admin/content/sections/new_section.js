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
                
                displayErrorOrSuccess(session, result, function(newSession, newResult)
                {
                    session = newSession;
                    result = newResult;
                
                    instance.getParentOptions(function(parentsList)
                    {
                        result = result.split('^parent_options^').join(parentsList);
                        
                        instance.getEditorOptions(session, function(editorsList)
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

this.getParentOptions = function(output)
{
    var sections = [];
    var parentsList = '';
    
    var instance = this;
    
    getDBObjectsWithValues({object_type: 'section', parent: null}, function(data)
    {
        if(data.length > 0)
        {
            for(var i = 0; i < data.length; i++)
            {
                parentsList = parentsList.concat('<option value="' + data[i]._id + '">' + data[i].name + '</option>');
            }
        }
        
        output(parentsList);
    });
}

this.getEditorOptions = function(session, output)
{
    templatesList = '';    
    
    getDBObjectsWithValues({object_type: 'user', admin: {$gt: 1}}, function(data)
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
