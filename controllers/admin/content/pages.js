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
            getHTMLTemplate('admin/head', 'Pages', null, function(data)
            {
                result = result.concat(data);
                result = getAdminNavigation(result, ['content', 'pages']);
                
                getHTMLTemplate('admin/content/pages', null, null, function(data)
                {
                    result = result.concat(data);
                    getHTMLTemplate('admin/footer', null, null, function(data)
                    {
                        result = result.concat(data);
                        if(session.section == 'pages')
                        {
                            result = result.concat(getJSTag('loadAdminContent("' + SITE_ROOT + '/admin/content/", "pages", "' + session.subsection + '")'));
                        }
                        else
                        {
                            result = result.concat(getJSTag('loadAdminContent("' + SITE_ROOT + '/admin/content/", "pages", "new_page")'));
                        }
                        
                        output({cookie: getSessionCookie(session), content: localize(['admin', 'pages'], result)});
                    });
                });
            });
        });
    });
}
