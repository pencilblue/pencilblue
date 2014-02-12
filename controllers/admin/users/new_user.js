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
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            output({redirect: pb.config.siteRoot + '/admin'});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/users/new_user', '^loc_NEW_USER^', null, function(data)
            {
                result = result.concat(data);
                
                result = result.split('^image_title^').join('^loc_USER_PHOTO^');
                result = result.split('^uploaded_image^').join('');
                
                var tabs =
                [
                    {
                        active: 'active',
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
            
                displayErrorOrSuccess(session, result, function(newSession, newResult)
                {
                    session = newSession;
                    result = newResult;
                    
                    var pills = require('../users').getPillNavOptions('new_user');
                    pills.unshift(
                    {
                        name: 'manage_users',
                        title: '^loc_NEW_USER^',
                        icon: 'chevron-left',
                        href: '/admin/users/manage_users'
                    });
                    
                    result = result.concat(pb.js.getAngularController(
                    {
                        navigation: getAdminNavigation(session, ['users']),
                        pills: pills,
                        tabs: tabs,
                        adminOptions: instance.getAdminOptions(session)
                    }));
                    
                    editSession(request, session, [], function(data)
                    {
                        output({cookie: getSessionCookie(session), content: localize(['admin', 'users', 'media'], result)});
                    });
                });
            });
        });
    });
}

this.getAdminOptions = function(session)
{
    var adminOptions =
    [
        {name: localize([], '^loc_READER^'), value: ACCESS_USER},
        {name: localize([], '^loc_WRITER^'), value: ACCESS_WRITER},
        {name: localize([], '^loc_EDITOR^'), value: ACCESS_EDITOR}
    ];
    
    if(session.user.admin >= ACCESS_MANAGING_EDITOR)
    {
        adminOptions.push({name: localize([], '^loc_MANAGING_EDITOR^'), value: ACCESS_MANAGING_EDITOR});
    }
    if(session.user.admin >= ACCESS_ADMINISTRATOR)
    {
        adminOptions.push({name: localize([], '^loc_ADMINISTRATOR^'), value: ACCESS_ADMINISTRATOR});
    }
    
    return adminOptions;
}
