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
            getHTMLTemplate('admin/head', 'Pages', null, function(data)
            {
                result = result.concat(data);
                getAdminNavigation(session, ['content', 'pages'], function(data)
                {
                    result = result.split('^admin_nav^').join(data);
                
                    var pillNavOptions = 
                    {
                        name: 'pages',
                        children: 
                        [
                            {
                                name: 'new_page',
                                title: '^loc_NEW_PAGE^',
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
                            if(session.section == 'pages')
                            {
                                result = result.concat(getJSTag('loadAdminContent("' + SITE_ROOT + '/admin/content/", "pages", "' + session.subsection + '")'));
                            }
                            else
                            {
                                result = result.concat(getJSTag('loadAdminContent("' + SITE_ROOT + '/admin/content/", "pages", "new_page")'));
                            }
                            
                            output({cookie: getSessionCookie(session), content: localize(['admin', 'pages'], result)});
                        });
                    });
                });
            });
        });
    });
}
