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
        
        getDBObjectsWithValues({object_type: 'section'}, function(data)
        {
            if(data.length == 0)
            {
                session.section = 'sections';
                session.subsection = 'new_section';
                
                editSession(request, session, [], function(data)
                {
                    output({cookie: getSessionCookie(session), content: getJSTag('window.location = "' + SITE_ROOT + '/admin/content/sections";')});
                });
                
                return;
            }
            
            session.section = 'sections';
            session.subsection = 'section_map';
    
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('admin/content/sections/section_map', null, null, function(data)
                {
                    result = result.concat(data);
                    
                    displayErrorOrSuccess(session, result, function(newSession, newResult)
                    {
                        session = newSession;
                        result = newResult;
                        
                        instance.getSections(function(sectionsList)
                        {
                            result = result.split('^sections^').join(sectionsList);
                            
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

this.getSections = function(output)
{
    var sections = [];
    var sectionTemplate = '';
    var subsectionTemplate = ''
    var sectionsList = '';
    
    getHTMLTemplate('admin/content/sections/section_map/section', null, null, function(data)
    {
        sectionTemplate = data;
        getHTMLTemplate('admin/content/sections/section_map/subsection', null, null, function(data)
        {
            subsectionTemplate = data;
            getDBObjectsWithValues({object_type: 'section'}, function(data)
            {
                if(data.length > 0)
                {
                    for(var i = 0; i < data.length; i++)
                    {
                        if(!data[i].parent)
                        {
                            var sectionListElement = sectionTemplate.split('^section_id^').join(data[i]._id);
                            sectionListElement = sectionListElement.split('^section_name^').join(data[i].name);
                            subsectionList = '';
                            
                            for(var j = 0; j < data.length; j++)
                            {
                                if(data[j].parent)
                                {
                                    if(data[i]._id.equals(ObjectID(data[j].parent)))
                                    {
                                        subsectionListElement = subsectionTemplate.split('^subsection_id^').join(data[j]._id);
                                        subsectionListElement = subsectionListElement.split('^subsection_name^').join(data[j].name);
                                        subsectionList = subsectionList.concat(subsectionListElement);
                                    }
                                }
                            }
                            if(subsectionList.length == 0)
                            {
                                sectionListElement = sectionListElement.split('^subsection_display^').join('style="display: none"');
                                sectionListElement = sectionListElement.split('^subsections^').join('');
                            }
                            else
                            {
                                sectionListElement = sectionListElement.split('^subsection_display^').join('');
                                sectionListElement = sectionListElement.split('^subsections^').join(subsectionList);
                            }
                            sectionsList = sectionsList.concat(sectionListElement);
                        }
                    }
                }
                
                output(sectionsList);
            });
        });
    });
}
