// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('user/manage_account', '^loc_MANAGE_ACCOUNT^', null, function(data)
            {
                result = result.concat(data);
                
                getDBObjectsWithValues({object_type: 'pencilblue_theme_settings'}, function(data)
                {
                    if(data.length == 0)
                    {
                        result = result.split('^site_logo^').join(pb.config.siteRoot + '/img/logo_menu.png');
                    }
                    else
                    {
                        result = result.split('^site_logo^').join(data[0].site_logo);
                    }
                
                    if(session.account_subsection)
                    {
                        result = result.concat(getJSTag('loadAccountContent("' + pb.config.siteRoot + '/user/manage_account", "' + session.account_subsection + '")'));
                    }
                    else
                    {
                        result = result.concat(getJSTag('loadAccountContent("' + pb.config.siteRoot + '/user/manage_account", "profile")'));
                    }
                
                    editSession(request, session, [], function(data)
                    {
                        output({cookie: getSessionCookie(session), content: localize(['users'], result)});
                    });
                });
            });
        });
    });
}
