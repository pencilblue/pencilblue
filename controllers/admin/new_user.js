// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({redirect: SITE_ROOT});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/head', 'New user', null, function(data)
            {
                result = result.concat(data);
                result = getAdminNavigation(result, 'users');
                
                getHTMLTemplate('admin/new_user', null, null, function(data)
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
                    
                    if(session['success'])
                    {
                        result = result.split('^success^').join('<div class="alert alert-success">' + session['success'] + '</div>');
                        delete session['success'];
                    }
                    else
                    {
                        result = result.split('^success^').join('');
                    }
                    
                    result = result.split('^admin_options^').join(instance.setAdminOptions(session));
                    
                    getHTMLTemplate('admin/footer', null, null, function(data)
                    {
                        result = result.concat(data);
                        editSession(request, session, [], function(data)
                        {
                            output({cookie: getSessionCookie(session), content: localize(['admin', 'new_user'], result)});
                        });
                    });
                });
            });
        });
    });
}

this.setAdminOptions = function(session)
{
    var optionsString = '<option value="1">^loc_WRITER^</option>';
    optionsString = optionsString.concat('<option value="0">^loc_READER^</option>');
    
    if(session['user']['admin'] > 1)
    {
        optionsString = optionsString.concat('<option value="2">^loc_EDITOR^</option>');
    }
    if(session['user']['admin'] > 2)
    {
        optionsString = optionsString.concat('<option value="3">^loc_ADMINISTRATOR^</option>');
    }
    
    return optionsString;
}
