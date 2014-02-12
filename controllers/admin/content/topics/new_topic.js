/*

    Interface for adding a new topic
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            output({redirect: pb.config.siteRoot + '/admin'});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/content/topics/new_topic', '^loc_NEW_TOPIC^', null, function(data)
            {
                result = result.concat(data);
                
                var tabs =
                [
                    {
                        active: 'active',
                        href: '#topic_settings',
                        icon: 'cog',
                        title: '^loc_SETTINGS^'
                    }
                ];
                
                displayErrorOrSuccess(session, result, function(newSession, newResult)
                {
                    session = newSession;
                    result = newResult;
                    
                    var pills = require('../topics').getPillNavOptions('new_topic');
                    pills.unshift(
                    {
                        name: 'manage_topics',
                        title: '^loc_NEW_TOPIC^',
                        icon: 'chevron-left',
                        href: '/admin/content/topics/manage_topics'
                    });
                    
                    result = result.concat(pb.js.getAngularController(
                    {
                        navigation: getAdminNavigation(session, ['content', 'topics']),
                        pills: pills,
                        tabs: tabs
                    }));
                    
                    editSession(request, session, [], function(data)
                    {
                        output({cookie: getSessionCookie(session), content: localize(['admin', 'topics'], result)});
                    });
                });
            });
        });
    });
}
