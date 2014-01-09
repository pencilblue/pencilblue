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
        session.subsection = 'email';

        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/site_settings/email', null, null, function(data)
            {
                result = result.concat(data);
                
                var tabs =
                [
                    {
                        active: true,
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
                
                getTabNav(tabs, function(tabNav)
                {
                    result = result.split('^tab_nav^').join(tabNav);
                    
                    getEmailSettings(function(emailSettings)
                    {
                        session = setFormFieldValues(emailSettings, session);
                
                        prepareFormReturns(session, result, function(newSession, newResult)
                        {
                            session = newSession;
                            result = newResult;
                            
                            editSession(request, session, [], function(data)
                            {
                                output({cookie: getSessionCookie(session), content: localize(['admin', 'site_settings', 'articles'], result)});
                            });
                        });
                    });
                });
            });
        });
    });
}
