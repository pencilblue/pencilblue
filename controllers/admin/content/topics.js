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
            getHTMLTemplate('admin/head', 'Topics', null, function(data)
            {
                result = result.concat(data);
                result = getAdminNavigation(result, ['content', 'sections']);
                
                getHTMLTemplate('admin/content/topics', null, null, function(data)
                {
                    result = result.concat(data);
                    getHTMLTemplate('admin/footer', null, null, function(data)
                    {
                        result = result.concat(data);
                        if(session.section == 'topics')
                        {
                            result = result.concat(getJSTag('loadAdminContent("' + pb.config.siteRoot + '/admin/content/", "topics", "' + session.subsection + '")'));
                        }
                        else
                        {
                            result = result.concat(getJSTag('loadAdminContent("' + pb.config.siteRoot + '/admin/content/", "topics", "manage_topics")'));
                        }
                        
                        output({cookie: getSessionCookie(session), content: localize(['admin', 'topics'], result)});
                    });
                });
            });
        });
    });
}
