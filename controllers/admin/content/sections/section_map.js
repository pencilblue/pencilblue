/*

    Organizes the site's sections via drag and drop
    
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
        
        getDBObjectsWithValues({object_type: 'section'}, function(data)
        {
            if(data.length == 0)
            {
                session.section = 'sections';
                session.subsection = 'new_section';
                
                editSession(request, session, [], function(data)
                {
                    output({cookie: getSessionCookie(session), content: getJSTag('window.location = "' + pb.config.siteRoot + '/admin/content/sections";')});
                });
                
                return;
            }
            
            session.section = 'sections';
            session.subsection = 'section_map';
            
            getDBObjectsWithValues({object_type: 'setting', key: 'section_map'}, function(data)
            {
                if(data.length == 0)
                {
                    session.section = 'sections';
                    session.subsection = 'new_section';
                    
                    editSession(request, session, [], function(data)
                    {
                        output({cookie: getSessionCookie(session), content: getJSTag('window.location = "' + pb.config.siteRoot + '/admin/content/sections";')});
                    });
                    
                    return;
                }
                
                var sectionMap = data[0].value;
        
                initLocalization(request, session, function(data)
                {
                    getHTMLTemplate('admin/content/sections/section_map', null, null, function(data)
                    {
                        result = result.concat(data);
                        
                        displayErrorOrSuccess(session, result, function(newSession, newResult)
                        {
                            session = newSession;
                            result = newResult;
                            
                            instance.getSections(sectionMap, function(sectionsList)
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
    });
}

this.getSections = function(sectionMap, output)
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
                    for(var i = 0; i < sectionMap.length; i++)
                    {
                        var sectionMatch = false;
                        
                        for(var j = 0; j < data.length; j++)
                        {
                            if(sectionMap[i].uid == data[j]._id)
                            {
                                var sectionListElement = sectionTemplate.split('^section_id^').join(data[j]._id);
                                sectionListElement = sectionListElement.split('^section_name^').join(data[j].name);
                                sectionMatch = true;
                                break;
                            }
                        }
                        
                        if(!sectionMatch)
                        {
                            break;
                        }
                        
                        subsectionList = '';
                        for(var o = 0; o < sectionMap[i].children.length; o++)
                        {
                            for(var j = 0; j < data.length; j++)
                            {
                                if(sectionMap[i].children[o].uid == data[j]._id)
                                {
                                    subsectionListElement = subsectionTemplate.split('^subsection_id^').join(data[j]._id);
                                    subsectionListElement = subsectionListElement.split('^subsection_name^').join(data[j].name);
                                    subsectionList = subsectionList.concat(subsectionListElement);
                                    break;
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
                
                output(sectionsList);
            });
        });
    });
}
