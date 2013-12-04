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
            getHTMLTemplate('admin/head', 'Topics', null, function(data)
            {
                result = result.concat(data);
                result = getAdminNavigation(result, ['content', 'sections']);
                
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
}
