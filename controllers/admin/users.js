/*

    Users administration page
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({redirect: SITE_ROOT});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/head', 'Pages', null, function(data)
            {
                result = result.concat(data);
                getAdminNavigation(session, ['users'], function(data)
                {
                    result = result.split('^admin_nav^').join(data);
                
                    var pillNavOptions = 
                    {
                        name: 'users',
                        children: 
                        [
                            {
                                name: 'manage_users',
                                title: '^loc_MANAGE_USERS^',
                                icon: 'list-alt',
                                folder: '/admin/'
                            },
                            {
                                name: 'new_user',
                                title: '^loc_NEW_USER^',
                                icon: 'plus',
                                folder: '/admin/'
                            }
                        ]
                    };
                    
                    getPillNavContainer(pillNavOptions, function(pillNav)
                    {
                        result = result.concat(pillNav);
                        getHTMLTemplate('admin/footer', null, null, function(data)
                        {
                            result = result.concat(data);
                            if(session.section == 'users')
                            {
                                result = result.concat(getJSTag('loadAdminContent("' + SITE_ROOT + '/admin/", "users", "' + session.subsection + '")'));
                            }
                            else
                            {
                                result = result.concat(getJSTag('loadAdminContent("' + SITE_ROOT + '/admin/", "users", "manage_users")'));
                            }
                            
                            output({cookie: getSessionCookie(session), content: localize(['admin', 'users'], result)});
                        });
                    });
                });
            });
        });
    });
}
