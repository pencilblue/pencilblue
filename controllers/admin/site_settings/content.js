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
        articles_per_page: 5,
        auto_break_articles: 0,
        display_timestamp: 1,
        date_format: 'Month dd, YYYY',
        display_hours_minutes: 1,
        time_format: '12',
        display_bylines: 1,
        display_writer_photo: 1,
        display_writer_position: 1,
        allow_comments: 1,
        default_comments: 1
    }
    
    return defaultContentSettings;
}
