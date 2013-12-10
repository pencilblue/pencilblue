// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({content: ''});
            return;
        }
        
        var get = getQueryParameters(request);
        if(!get['id'])
        {
            instance.invalidIDProvided(request, session, output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'user', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                instance.invalidIDProvided(request, session, output);
                return;
            }
            
            var user = data[0];
    
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('admin/users/edit_user', null, null, function(data)
                {
                    result = result.concat(data);
                    
                    result = result.split('^user_id^').join(user._id);
                    result = instance.setTextDefaults(result, user);
                    
                    result = result.split('^admin_options^').join(instance.setAdminOptions(user, session));
                    
                    editSession(request, session, [], function(data)
                    {
                        output({cookie: getSessionCookie(session), content: localize(['admin', 'users'], result)});
                    });
                });
            });
        });
    });
}

this.setTextDefaults = function(result, user)
{
    result = result.split('^username^').join(user.username);
    result = result.split('^email^').join(user.email);
    result = result.split('^first_name^').join(user.first_name);
    result = result.split('^last_name^').join(user.last_name);
    
    return result;
}

this.setAdminOptions = function(user, session)
{
    var optionsString = '<option value="1"' + ((user.admin == 1) ? ' selected="selected"' : '') + '>^loc_WRITER^</option>';
    
    optionsString = optionsString.concat('<option value="0"' + ((user.admin == 0) ? ' selected="selected"' : '') + '>^loc_READER^</option>');
    
    if(session['user']['admin'] > 1)
    {
        optionsString = optionsString.concat('<option value="2"' + ((user.admin == 2) ? ' selected="selected"' : '') + '>^loc_EDITOR^</option>');
    }
    if(session['user']['admin'] > 2)
    {
        optionsString = optionsString.concat('<option value="3"' + ((user.admin == 3) ? ' selected="selected"' : '') + '>^loc_MANAGING_EDITOR^</option>');
    }
    if(session['user']['admin'] > 3)
    {
        optionsString = optionsString.concat('<option value="4"' + ((user.admin == 4) ? ' selected="selected"' : '') + '>^loc_ADMINISTRATOR^</option>');
    }
    
    return optionsString;
}

this.invalidIDProvided = function(request, session, output)
{
    session.section = 'users';
    session.subsection = 'manage_users';
    editSession(request, session, [], function(data)
    {
        output({cookie: getSessionCookie(session), content: getJSTag('window.location = "' + pb.config.siteRoot + '/admin/users";')});
    });
}
