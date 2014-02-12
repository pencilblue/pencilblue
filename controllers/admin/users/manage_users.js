/*

    Interface for managing users
    
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
        
        getDBObjectsWithValues({object_type: 'user', admin: {$lte: session.user.admin}}, function(data)
        {
            if(data.length == 0)
            {
                output({redirect: pb.config.siteRoot + '/admin'});
                return;
            }
            
            var users = data;
    
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('admin/users/manage_users', '^loc_MANAGE_USERS^', null, function(data)
                {
                    result = result.concat(data);
                    
                    displayErrorOrSuccess(session, result, function(newSession, newResult)
                    {
                        session = newSession;
                        result = newResult;
                        
                        var pills = require('../users').getPillNavOptions('manage_users');
                        pills.unshift(
                        {
                            name: 'manage_users',
                            title: '^loc_MANAGE_USERS^',
                            icon: 'refresh',
                            href: '/admin/users/manage_users'
                        });
                        
                        result = result.concat(pb.js.getAngularController(
                        {
                            navigation: getAdminNavigation(session, ['users']),
                            pills: pills,
                            users: users
                        }, [], 'initUsersPagination()'));
                            
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
