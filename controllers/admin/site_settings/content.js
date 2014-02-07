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
            getHTMLTemplate('admin/site_settings/content', '^loc_CONTENT^', null, function(data)
            {
                result = result.concat(data);
                
                var tabs =
                [
                    {
                        active: 'active',
                        href: '#articles',
                        icon: 'files-o',
                        title: '^loc_ARTICLES^'
                    },
                    {
                        href: '#timestamp',
                        icon: 'clock-o',
                        title: '^loc_TIMESTAMP^'
                    },
                    {
                        href: '#authors',
                        icon: 'user',
                        title: '^loc_AUTHOR^'
                    },
                    {
                        href: '#comments',
                        icon: 'comment',
                        title: '^loc_COMMENTS^'
                    }
                ];
                    
                getContentSettings(function(contentSettings)
                {
                    session = setFormFieldValues(contentSettings, session);
            
                    prepareFormReturns(session, result, function(newSession, newResult)
                    {
                        session = newSession;
                        result = newResult;
                        
                        var pills = require('../site_settings').getPillNavOptions('content');
                        pills.splice(0, 1);
                        pills.unshift(
                        {
                            name: 'configuration',
                            title: '^loc_CONTENT^',
                            icon: 'chevron-left',
                            href: '/admin/site_settings/configuration'
                        });
                        
                        result = result.concat(getAngularController(
                        {
                            navigation: getAdminNavigation(session, ['settings', 'site_settings']),
                            pills: pills,
                            tabs: tabs
                        }));
                        
                        editSession(request, session, [], function(data)
                        {
                            output({cookie: getSessionCookie(session), content: localize(['admin', 'site_settings'], result)});
                        });
                    });
                });
            });
        });
    });
}
