global.formError = function(request, session, message, redirectLocation, output)
{
    session.error = message;
    editSession(request, session, [], function(data)
    {        
        output({redirect: SITE_ROOT + redirectLocation});
    });
}

global.displayErrorOrSuccess = function(session, result, output)
{
    if(session['error'])
    {
        result = result.split('^error^').join('<div class="alert alert-danger">' + session['error'] + '</div>');
        delete session['error'];
    }
    else
    {
        result = result.split('^error^').join('');
    }
    
    if(session['success'])
    {
        result = result.split('^success^').join('<div class="alert alert-success">' + session['success'] + '</div>');
        delete session['success'];
    }
    else
    {
        result = result.split('^success^').join('');
    }
    
    output(session, result);
}
