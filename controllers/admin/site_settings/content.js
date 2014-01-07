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
            output({content: ''});
            return;
        }
        
        session.section = 'site_settings';
        session.subsection = 'content';

        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/site_settings/content', null, null, function(data)
            {
                result = result.concat(data);
                
                var tabs =
                [
                    {
                        active: true,
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
                        href: '#writers',
                        icon: 'user',
                        title: '^loc_WRITERS^'
                    },
                    {
                        href: '#comments',
                        icon: 'comment',
                        title: '^loc_COMMENTS^'
                    }
                ];
                
                getTabNav(tabs, function(tabNav)
                {
                    result = result.split('^tab_nav^').join(tabNav);
                    
                    getContentSettings(function(contentSettings)
                    {
                        session = setFormFieldValues(contentSettings, session);
                
                        prepareFormReturns(session, result, function(newSession, newResult)
                        {
                            session = newSession;
                            result = newResult;
                            
                            editSession(request, session, [], function(data)
                            {
                                output({cookie: getSessionCookie(session), content: localize(['admin', 'site_settings'], result)});
                            });
                        });
                    });
                });
            });
        });
    });
}
