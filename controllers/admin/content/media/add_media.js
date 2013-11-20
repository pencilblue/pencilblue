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
        
        session.section = 'media';
        session.subsection = 'add_media';
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/content/media/add_media', null, null, function(data)
            {
                result = result.concat(data);
                
                displayErrorOrSuccess(session, result, function(newSession, newResult)
                {
                    session = newSession;
                    result = newResult;
                    
                    editSession(request, session, [], function(data)
                    {
                        output({cookie: getSessionCookie(session), content: localize(['admin', 'media'], result)});
                    });
                });
            });
        });
    });
}
