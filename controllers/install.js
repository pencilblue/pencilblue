// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('install', 'Install pencilblue', null, function(data)
            {
                result = result.concat(data);
                
                displayErrorOrSuccess(session, result, function(newSession, newResult)
                {
                    session = newSession;
                    result = newResult;
                
                    editSession(request, session, [], function(data)
                    {
                        output({cookie: getSessionCookie(session), content: localize(['install'], result)});
                    });
                });
            });
        });
    });
}
