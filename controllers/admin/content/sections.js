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
            getHTMLTemplate('admin/head', 'Sections', null, function(data)
            {
                result = result.concat(data);
                result = getAdminNavigation(result, ['content', 'sections']);
                
                getHTMLTemplate('admin/content/sections', null, null, function(data)
                {
                    result = result.concat(data);
                    getHTMLTemplate('admin/footer', null, null, function(data)
                    {
                        result = result.concat(data);
                        if(session.section == 'sections')
                        {
                            result = result.concat(getJSTag('loadAdminContent("' + SITE_ROOT + '/admin/content/", "sections", "' + session.subsection + '")'));
                        }
                        else
                        {
                            result = result.concat(getJSTag('loadAdminContent("' + SITE_ROOT + '/admin/content/", "sections", "section_map")'));
                        }
                        
                        output({cookie: getSessionCookie(session), content: localize(['admin', 'sections'], result)});
                    });
                });
            });
        });
    });
}
