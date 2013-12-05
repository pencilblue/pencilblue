/*

    Interface for adding a new user
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized({logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            output({content: ''});
            return;
        }
        
        session.section = 'users';
        session.subsection = 'new_user';
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/users/new_user', null, null, function(data)
            {
                result = result.concat(data);
                
                var tabs =
                [
                    {
                        active: true,
                        href: '#account_info',
                        icon: 'cog',
                        title: '^loc_ACCOUNT_INFO^'
                    },
                    {
                        href: '#personal_info',
                        icon: 'user',
                        title: '^loc_PERSONAL_INFO^'
                    }
                ];
                
                getTabNav(tabs, function(tabNav)
                {
                    result = result.split('^tab_nav^').join(tabNav);
                
                    displayErrorOrSuccess(session, result, function(newSession, newResult)
                    {
                        session = newSession;
                        result = newResult;
                        
                        result = result.split('^admin_options^').join(instance.setAdminOptions(session));
                        
                        editSession(request, session, [], function(data)
                        {
                            output({cookie: getSessionCookie(session), content: localize(['admin', 'users'], result)});
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
        optionsString = optionsString.concat('<option value="3">^loc_MANAGING_EDITOR^</option>');
    }
    if(session['user']['admin'] > 3)
    {
        optionsString = optionsString.concat('<option value="4">^loc_ADMINISTRATOR^</option>');
    }
    
    return optionsString;
}
