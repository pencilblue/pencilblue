// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/login', 'Home', null, function(data)
            {
                result = result.concat(data);
                
                if(session['error'])
                {
                    result = result.split('^error^').join('<div class="alert alert-danger">' + session['error'] + '</div>');
                    delete session['error'];
                }
                else
                {
                    result = result.split('^error^').join('');
                }
                
                editSession(request, session, [], function(data)
                {
                    output({cookie: getSessionCookie(session), content: localize(['login'], result)});
                });
            });
        });
    });
}
