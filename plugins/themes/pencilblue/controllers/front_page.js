// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('head', 'Home', null, function(data)
            {
                result = result.concat(data);
                getHTMLTemplate('index', null, null, function(data)
                {
                    result = result.concat(data);
                    getHTMLTemplate('footer', null, null, function(data)
                    {
                        result = result.concat(data);
                        output({cookie: getSessionCookie(session), content: localize(['index'], result)});
                    });
                });
            });
        });
    });
}
