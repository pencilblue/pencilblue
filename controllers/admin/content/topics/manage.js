// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({content: ''});
            return;
        }
        
        session.section = 'topics';
        session.subsection = 'manage';
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/content/topics/manage', null, null, function(data)
            {
                result = result.concat(data);
                output({cookie: getSessionCookie(session), content: localize(['admin', 'topics'], result)});
            });
        });
    });
}
