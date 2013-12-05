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
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            output({redirect: SITE_ROOT});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/head', 'Topics', null, function(data)
            {
                result = result.concat(data);
                getAdminNavigation(session, ['content', 'topics'], function(data)
                {
                    result = result.split('^admin_nav^').join(data);
                
                    var pillNavOptions = 
                    {
                        name: 'topics',
                        children: 
                        [
                            {
                                name: 'manage_topics',
                                title: '^loc_MANAGE_TOPICS^',
                                icon: 'list-alt',
                                folder: '/admin/content/'
                            },
                            {
                                name: 'new_topic',
                                title: '^loc_NEW_TOPIC^',
                                icon: 'plus',
                                folder: '/admin/content/'
                            },
                            {
                                name: 'import_topics',
                                title: '^loc_IMPORT_TOPICS^',
                                icon: 'upload',
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
                            if(session.section == 'topics')
                            {
                                result = result.concat(getJSTag('loadAdminContent("' + SITE_ROOT + '/admin/content/", "topics", "' + session.subsection + '")'));
                            }
                            else
                            {
                                result = result.concat(getJSTag('loadAdminContent("' + SITE_ROOT + '/admin/content/", "topics", "manage_topics")'));
                            }
                            
                            output({cookie: getSessionCookie(session), content: localize(['admin', 'topics'], result)});
                        });
                    });
                });
            });
        });
    });
}
