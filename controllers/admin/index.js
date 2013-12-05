// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized({logged_in: true, admin_level: ACCESS_WRITER}))
        {
            output({redirect: SITE_ROOT + '/admin/login'});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/head', 'Dashboard', null, function(data)
            {
                result = result.concat(data);
                getAdminNavigation(session, ['dashboard'], function(data)
                {
                    result = result.split('^admin_nav^').join(data);
                
                    getHTMLTemplate('admin/index', null, null, function(data)
                    {
                        result = result.concat(data);
                        getHTMLTemplate('admin/footer', null, null, function(data)
                        {
                            result = result.concat(data);
                            output({cookie: getSessionCookie(session), content: localize(['admin'], result)});
                        });
                    });
                });
            });
        });
    });
}
