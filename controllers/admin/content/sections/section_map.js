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
            output({redirect: pb.config.siteRoot + '/admin'});
            return;
        }
        
        getDBObjectsWithValues({object_type: 'section'}, function(data)
        {
            if(data.length == 0)
            {
                output({redirect: pb.config.siteRoot + '/admin/content/sections/new_section'});
                return;
            }
            
            var sections = data;
            
            getDBObjectsWithValues({object_type: 'setting', key: 'section_map'}, function(data)
            {
                if(data.length == 0)
                {
                    output({redirect: pb.config.siteRoot + '/admin/content/sections/new_section'});
                    return;
                }
                
                var sectionMap = data[0].value;
        
                initLocalization(request, session, function(data)
                {
                    getHTMLTemplate('admin/content/sections/section_map', '^loc_SECTION_MAP^', null, function(data)
                    {
                        result = result.concat(data);
                        
                        getAdminNavigation(session, ['content', 'sections'], function(data)
                        {
                            result = result.split('^admin_nav^').join(data);
                                
                            displayErrorOrSuccess(session, result, function(newSession, newResult)
                            {
                                session = newSession;
                                result = newResult;
                                
                                result = result.concat(getAngularController({pills: require('../sections').getPillNavOptions('section_map'), sections: instance.getOrderedSections(sections, sectionMap)}));
                                
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

this.getOrderedSections = function(sections, sectionMap)
{
    var orderedSections = [];

    for(var i = 0; i < sectionMap.length; i++)
    {
        var parentSection = null;
        
        for(var j = 0; j < sections.length; j++)
        {
            if(sectionMap[i].uid == sections[j]._id)
            {
                parentSection = sections[j];
                parentSection.children = [];
                break;
            }
        }
        
        if(!parentSection)
        {
            continue;
        }
        
        for(var o = 0; o < sectionMap[i].children.length; o++)
        {
            for(var j = 0; j < sections.length; j++)
            {
                if(sectionMap[i].children[o].uid == sections[j]._id)
                {
                    parentSection.children.push(sections[j]);
                    break;
                }
            }
        }
        
        orderedSections.push(parentSection);
    }
    
    return orderedSections;
}
