/*

    Pages administration page
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized({logged_in: true, admin_level: ACCESS_WRITER}))
        {
            output({redirect: SITE_ROOT});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/head', 'Sections', null, function(data)
            {
                result = result.concat(data);
                getAdminNavigation(session, ['content', 'sections'], function(data)
                {
                    result = result.split('^admin_nav^').join(data);
                
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
    });
}
