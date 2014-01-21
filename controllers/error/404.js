// Retrieve the 404 template and return it to the router
this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        initLocalization(request, session, function(success)
        {
            getHTMLTemplate('error/404', '404', null, function(data)
            {
                result = result.concat(data);
                
                getContentSettings(function(contentSettings)
                {
                    require('../../include/theme/top_menu').getTopMenu(session, function(themeSettings, navigation, accountButtons)
                    {
                        var loggedIn = false;
                        if(session.user)
                        {
                            loggedIn = true;
                        }
                       
                        result = result.concat(getAngularController(
                        {
                            navigation: navigation,
                            contentSettings: contentSettings,
                            loggedIn: loggedIn,
                            themeSettings: themeSettings,
                            accountButtons: accountButtons
                        }));
                        
                        output({content: localize(['error'], result)});
                    });
                });
            });
        });
    });
}
