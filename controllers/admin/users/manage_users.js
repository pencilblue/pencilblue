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
                    
                    getAdminNavigation(session, ['users'], function(data)
                    {
                        result = result.split('^admin_nav^').join(data);
                    
                        displayErrorOrSuccess(session, result, function(newSession, newResult)
                        {
                            session = newSession;
                            result = newResult;
                            
                            result = result.concat(getAngularController({pills: require('../users').getPillNavOptions('manage_users'), users: users}));
                                
                            editSession(request, session, [], function(data)
                            {
                                output({cookie: getSessionCookie(session), content: localize(['admin', 'users'], result)});
                            });
                        });
                    });
                });
            });
        });
    });
}
