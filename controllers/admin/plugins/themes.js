// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({redirect: pb.config.siteRoot});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/plugins/themes', 'Themes', null, function(data)
            {
                result = result.concat(data);
                
                getAdminNavigation(session, ['plugins', 'themes'], function(data)
                {
                    result = result.split('^admin_nav^').join(data);
                    
                    instance.getThemes(function(themes)
                    {
                        for(var i = 0; i < themes.length; i++)
                        {
                            if(themes[i].active)
                            {
                                result = result.split('^active_theme_settings^').join(themes[i].settingsURL);
                                var themeSettingsURL = themes[i].settingsURL;
                                break;
                            }
                        }
                        
                        result = result.concat(getAngularController({pills: themes, themeSettingsURL: themeSettingsURL}));
                               
                        editSession(request, session, [], function(data)
                        {
                            output({cookie: getSessionCookie(session), content: localize(['admin', 'themes'], result)});
                        });
                    });
                });
            });
        });
    });
}

this.getThemes = function(output)
{
    var themes = [];
    
    fs.readdir(DOCUMENT_ROOT + '/plugins/themes', function(error, directory)
    {
        for(var sub in directory)
        {
            if(fs.existsSync(DOCUMENT_ROOT + '/plugins/themes/' + directory[sub] + '/details.json'))
            {
                var themeData = JSON.parse(fs.readFileSync(DOCUMENT_ROOT + '/plugins/themes/' + directory[sub] + '/details.json'));
                if(themeData.settings)
                {
                    if(fs.existsSync(DOCUMENT_ROOT + '/plugins/themes/' + directory[sub] + '/controllers' + themeData.settings + '.js'))
                    {
                        themes.push(
                        {
                            name: themeData.uid,
                            title: themeData.name,
                            icon: (themeData.icon) ? themeData.icon : '',
                            settingsURL: themeData.settings,
                            href: 'javascript:activateThemePill("' + themeData.name + '")'
                        });
                    }
                }
            }
        }
        
        getDBObjectsWithValues({object_type: 'setting', key: 'active_theme'}, function(data)
        {
            if(data.length > 0)
            {
                themes[0].active = 'active';
            }
            
            for(var i = 0; i < themes.length; i++)
            {
                if(themes[i].name == data[0].value)
                {
                    themes[i].active = 'active';
                }
            }
        
            output(themes);
        });
    });
}
