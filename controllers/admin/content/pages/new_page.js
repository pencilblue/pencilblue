/*

    Interface for adding a new page
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
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
                
                var tabs =
                [
                    {
                        active: true,
                        href: '#content',
                        icon: 'quote-left',
                        title: '^loc_CONTENT^'
                    },
                    {
                        href: '#meta_data',
                        icon: 'tasks',
                        title: '^loc_META_DATA^'
                    }
                ];
                
                getTabNav(tabs, function(tabNav)
                {
                    result = result.split('^tab_nav^').join(tabNav);
                
                    instance.getTemplateOptions(function(templatesList)
                    {
                        result = result.split('^template_options^').join(templatesList);
                    
                        editSession(request, session, [], function(data)
                        {
                            output({content: localize(['admin', 'pages', 'articles', 'media'], result)});
                        });
                    });
                });
            });
        });
    });
}

this.getTemplateOptions = function(output)
{
    availableTemplates = [];
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
                        var templateFile = directory[file].substr(0, directory[file].indexOf('.js'));
                        availableTemplates.push(templateFile);
                    }
                }
                
                fs.readFile(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/details.json', function(error, data)
                {
                    if(error)
                    {
                        output('');
                        return;
                    }
                    
                    var details = JSON.parse(data);
                    for(var i = 0; i < details.content_templates.length; i++)
                    {
                        for(var j = 0; j < availableTemplates.length; j++)
                        {
                            if(details.content_templates[i].file == availableTemplates[j])
                            {
                                templatesList = templatesList.concat('<option value="' + details.content_templates[i].file + '">' + details.content_templates[i].name + '</option>');
                            }
                        }
                    }
                    
                    output(templatesList);
                });
            });
        }
        else
        {
            output('');
        }
    });
}
