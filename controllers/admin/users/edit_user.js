/*

    Interface for editing a user
    
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
        
        var get = getQueryParameters(request);
        if(!get['id'])
        {
            output({redirect: pb.config.siteRoot + '/admin/users/manage_users'});
            return;
        }
        
        getDBObjectsWithValues({object_type: 'user', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                output({redirect: pb.config.siteRoot + '/admin/users/manage_users'});
                return;
            }
            
            var user = data[0];
            delete user.password;
    
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('admin/users/edit_user', null, null, function(data)
                {
                    result = result.concat(data);
                    
                    result = result.split('^user_id^').join(user._id);
                    result = result.split('^image_title^').join('^loc_USER_PHOTO^');
                    result = result.split('^uploaded_image^').join((user.photo) ? user.photo : '');
                    
                    getAdminNavigation(session, ['users'], function(data)
                    {
                        result = result.split('^admin_nav^').join(data);
                    
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
                            
                            result = result.concat(getAngularController({pills: require('../users').getPillNavOptions('edit_user'), tabs: tabs, adminOptions: instance.getAdminOptions(session), user: user}));
                                            
                            editSession(request, session, [], function(data)
                            {
                                output({cookie: getSessionCookie(session), content: localize(['admin', 'users', 'media'], result)});
                            });
                        });
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
