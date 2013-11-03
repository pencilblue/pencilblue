// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        /*if(!session['user'] || !session['user']['admin'])
        {
            output({redirect: SITE_ROOT + '/admin/login'});
            return;
        }*/
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/head', 'Home', null, function(data)
            {
                result = result.concat(data);
                result = getAdminNavigation(result, 'dashboard');
                
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
}
