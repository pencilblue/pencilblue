/*

    Interface for changing the site configuration
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_ADMINISTRATOR}))
        {
            output({redirect: pb.config.siteRoot + '/admin'});
            return;
        }

        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/site_settings/email', null, null, function(data)
            {
                result = result.concat(data);
                
                var tabs =
                [
                    {
                        active: 'active',
                        href: '#preferences',
                        icon: 'wrench',
                        title: '^loc_PREFERENCES^'
                    },
                    {
                        href: '#smtp',
                        icon: 'upload',
                        title: '^loc_SMTP^'
                    }
                ];
                    
                getEmailSettings(function(emailSettings)
                {
                    session = setFormFieldValues(emailSettings, session);
            
                    prepareFormReturns(session, result, function(newSession, newResult)
                    {
                        session = newSession;
                        result = newResult;
                        
                        var pills = require('../site_settings').getPillNavOptions('email');
                        pills.splice(1, 1);
                        pills.unshift(
                        {
                            name: 'configuration',
                            title: '^loc_EMAIL^',
                            icon: 'chevron-left',
                            href: '/admin/site_settings/configuration'
                        });
                        
                        result = result.concat(pb.js.getAngularController(
                        {
                            navigation: getAdminNavigation(session, ['settings', 'site_settings']),
                            pills: pills,
                            tabs: tabs
                        }));
                        
                        editSession(request, session, [], function(data)
                        {
                            output({cookie: getSessionCookie(session), content: localize(['admin', 'site_settings', 'articles'], result)});
                        });
                    });
                });
            });
        });
    });
}
