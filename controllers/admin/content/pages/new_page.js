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
        
        session.section = 'pages';
        session.subsection = 'new_page';
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/content/pages/new_page', null, null, function(data)
            {
                result = result.concat(data);
                
                instance.getTemplateOptions(function(templatesList)
                {
                    result = result.split('^template_options^').join(templatesList);
                
                    editSession(request, session, [], function(data)
                    {
                        output({content: localize(['admin', 'pages'], result)});
                    });
                });
            });
        });
    });
}

this.getTemplateOptions = function(output)
{
    templatesList = '';    
    
    getDBObjectsWithValues({object_type: 'setting', key: 'active_theme'}, function(data)
    {
        if(data.length > 0)
        {
            fs.readdir(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/controllers', function(error, directory)
            {
                for(var file in directory)
                {
                    if(directory[file].indexOf('.js') > -1)
                    {
                        var templateName = directory[file].substr(0, directory[file].indexOf('.js'));
                        templatesList = templatesList.concat('<option value="' + templateName + '">' + templateName + '</option>');
                    }
                }
                
                output(templatesList);
            });
        }
        else
        {
            output('');
        }
    });
}
