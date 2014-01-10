/*

    Settings administration page
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_ADMINISTRATOR}))
        {
            output({redirect: pb.config.siteRoot});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/head', 'Settings', null, function(data)
            {
                result = result.concat(data);
                getAdminNavigation(session, ['settings'], function(data)
                {
                    result = result.split('^admin_nav^').join(data);
                
                    var pillNavOptions = 
                    {
                        name: 'site_settings',
                        children: 
                        [
                            {
                                name: 'configuration',
                                title: '^loc_CONFIGURATION^',
                                icon: 'flask',
                                folder: '/admin/'
                            },
                            {
                                name: 'content',
                                title: '^loc_CONTENT^',
                                icon: 'quote-right',
                                folder: '/admin/'
                            }
                        ]
                    };
                    
                    getPillNavContainer(pillNavOptions, function(pillNav)
                    {
                        result = result.concat(pillNav);
                        getHTMLTemplate('admin/footer', null, null, function(data)
                        {
                            result = result.concat(data);
                            if(session.section == 'site_settings')
                            {
                                result = result.concat(getJSTag('loadAdminContent("' + pb.config.siteRoot + '/admin/", "site_settings", "' + session.subsection + '")'));
                            }
                            else
                            {
                                result = result.concat(getJSTag('loadAdminContent("' + pb.config.siteRoot + '/admin/", "site_settings", "configuration")'));
                            }
                            
                            output({cookie: getSessionCookie(session), content: localize(['admin', 'site_settings'], result)});
                        });
                    });
                });
            });
        });
    });
};
