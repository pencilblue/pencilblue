// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            output({redirect: pb.config.siteRoot + '/admin/login'});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/index', '^loc_DASHBOARD^', null, function(data)
            {
                result = result.concat(data);
                getAdminNavigation(session, ['dashboard'], function(data)
                {
                    result = result.split('^admin_nav^').join(data);
                        
                    getDBObjectsWithValues({object_type: 'article'}, function(articles)
                    {
                        var contentInfo = [{name: localize(['admin'], '^loc_ARTICLES^'), count: articles.length, href: '/admin/content/articles/manage_articles'}];
                        
                        getDBObjectsWithValues({object_type: 'page'}, function(pages)
                        {
                            contentInfo.push({name: localize(['admin'], '^loc_PAGES^'), count: pages.length, href: '/admin/content/pages/manage_pages'});
                            
                            result = result.concat(getAngularController({contentInfo: contentInfo}));
                            
                            output({cookie: getSessionCookie(session), content: localize(['admin'], result)});
                        });
                    });
                });
            });
        });
    });
}
