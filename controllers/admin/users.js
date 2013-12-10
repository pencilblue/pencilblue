// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({redirect: pb.config.siteRoot});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/head', 'Pages', null, function(data)
            {
                result = result.concat(data);
                result = getAdminNavigation(result, ['users']);
                
                getHTMLTemplate('admin/users', null, null, function(data)
                {
                    result = result.concat(data);
                    getHTMLTemplate('admin/footer', null, null, function(data)
                    {
                        result = result.concat(data);
                        if(session.section == 'users')
                        {
                            result = result.concat(getJSTag('loadAdminContent("' + pb.config.siteRoot + '/admin/", "users", "' + session.subsection + '")'));
                        }
                        else
                        {
                            result = result.concat(getJSTag('loadAdminContent("' + pb.config.siteRoot + '/admin/", "users", "manage_users")'));
                        }
                        
                        output({cookie: getSessionCookie(session), content: localize(['admin', 'users'], result)});
                    });
                });
            });
        });
    });
}
