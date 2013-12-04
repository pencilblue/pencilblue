// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({redirect: SITE_ROOT});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/head', 'Sections', null, function(data)
            {
                result = result.concat(data);
                result = getAdminNavigation(result, ['content', 'sections']);
                
                var pillNavOptions = 
                {
                    name: 'sections',
                    children: 
                    [
                        {
                            name: 'section_map',
                            title: '^loc_SECTION_MAP^',
                            icon: 'sitemap',
                            folder: '/admin/content/'
                        },
                        {
                            name: 'new_section',
                            title: '^loc_NEW_SECTION^',
                            icon: 'plus',
                            folder: '/admin/content/'
                        }
                    ]
                };
            
                getPillNavContainer(pillNavOptions, function(pillNav)
                {
                    result = result.concat(pillNav);
                    getHTMLTemplate('admin/footer', null, null, function(data)
                    {
                        result = result.concat(data);
                        if(session.section == 'sections')
                        {
                            result = result.concat(getJSTag('loadAdminContent("' + SITE_ROOT + '/admin/content/", "sections", "' + session.subsection + '")'));
                        }
                        else
                        {
                            result = result.concat(getJSTag('loadAdminContent("' + SITE_ROOT + '/admin/content/", "sections", "section_map")'));
                        }
                        
                        output({cookie: getSessionCookie(session), content: localize(['admin', 'sections'], result)});
                    });
                });
            });
        });
    });
}
