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
                        href: '#comments',
                        icon: 'comment',
                        title: '^loc_COMMENTS^'
                    }
                ];
                
                getTabNav(tabs, function(tabNav)
                {
                    result = result.split('^tab_nav^').join(tabNav);
                    
                    getDBObjectsWithValues({object_type: 'setting', key: 'content_settings'}, function(data)
                    {
                        if(data.length == 0)
                        {
                            var contentSettings = instance.getDefaultContentSettings();
                        }
                        else
                        {
                            var contentSettings = data[0].value;
                        }
                        
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

this.getDefaultContentSettings = function()
{
    defaultContentSettings =
    {
        allow_comments: 1,
        default_comments: 1
    }
    
    return defaultContentSettings;
}
