/*

    Articles administration page
    
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
            getHTMLTemplate('admin/head', 'Articles', null, function(data)
            {
                result = result.concat(data);
                result = getAdminNavigation(result, ['content', 'articles']);
                
                var pillNavOptions = 
                {
                    name: 'articles',
                    children: 
                    [
                        {
                            name: 'new_article',
                            title: '^loc_NEW_ARTICLE^',
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
                        if(session.section == 'articles')
                        {
                            result = result.concat(getJSTag('loadAdminContent("' + SITE_ROOT + '/admin/content/", "articles", "' + session.subsection + '")'));
                        }
                        else
                        {
                            result = result.concat(getJSTag('loadAdminContent("' + SITE_ROOT + '/admin/content/", "articles", "new_article")'));
                        }
                        
                        output({cookie: getSessionCookie(session), content: localize(['admin', 'articles'], result)});
                    });
                });
            });
        });
    });
}
