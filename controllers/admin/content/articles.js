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
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            output({redirect: pb.config.siteRoot});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/head', 'Articles', null, function(data)
            {
                result = result.concat(data);
                getAdminNavigation(session, ['content', 'articles'], function(data)
                {
                    result = result.split('^admin_nav^').join(data);
                
                    var pillNavOptions = 
                    {
                        name: 'articles',
                        children: 
                        [
                            {
                                name: 'manage_articles',
                                title: '^loc_MANAGE_ARTICLES^',
                                icon: 'files-o',
                                folder: '/admin/content/'
                            },
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
                                result = result.concat(getJSTag('loadAdminContent("' + pb.config.siteRoot + '/admin/content/", "articles", "' + session.subsection + '")'));
                            }
                            else
                            {
                                result = result.concat(getJSTag('loadAdminContent("' + pb.config.siteRoot + '/admin/content/", "articles", "manage_articles")'));
                            }
                            
                            output({cookie: getSessionCookie(session), content: localize(['admin', 'articles'], result)});
                        });
                    });
                });
            });
        });
    });
}
