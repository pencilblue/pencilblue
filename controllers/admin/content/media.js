/*

    Media administration page
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            output({redirect: pb.config.siteRoot});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/head', 'Media', null, function(data)
            {
                result = result.concat(data);
                getAdminNavigation(session, ['content', 'media'], function(data)
                {
                    result = result.split('^admin_nav^').join(data);
                
                    var pillNavOptions = 
                    {
                        name: 'media',
                        children: 
                        [
                            {
                                name: 'manage_media',
                                title: '^loc_MANAGE_MEDIA^',
                                icon: 'list-alt',
                                folder: '/admin/content/'
                            },
                            {
                                name: 'add_media',
                                title: '^loc_ADD_MEDIA^',
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
                            if(session.section == 'media')
                            {
                                result = result.concat(getJSTag('loadAdminContent("' + pb.config.siteRoot + '/admin/content/", "media", "' + session.subsection + '")'));
                            }
                            else
                            {
                                result = result.concat(getJSTag('loadAdminContent("' + pb.config.siteRoot + '/admin/content/", "media", "manage_media")'));
                            }
                            
                            output({cookie: getSessionCookie(session), content: localize(['admin', 'media'], result)});
                        });
                    });
                });
            });
        });
    });
}
