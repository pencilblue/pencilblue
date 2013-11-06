// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({redirect: SITE_ROOT});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/head', 'Themes', null, function(data)
            {
                result = result.concat(data);
                result = getAdminNavigation(result, 'themes');
                
                getHTMLTemplate('admin/plugins/themes', null, null, function(data)
                {
                    result = result.concat(data);
                    
                    instance.getThemes(function(themesList, firstTheme)
                    {
                        result = result.split('^themes^').join(themesList);
                        
                        if(session.section == 'themes')
                        {
                            result = result.concat(getJSTag('loadThemeSettings("' + SITE_ROOT + '", "' + session.subsection + '")'));
                        }
                        else if(firstTheme)
                        {
                            result = result.concat(getJSTag('loadThemeSettings("' + SITE_ROOT + '", "' + firstTheme + '")'));
                        }
                        
                        getHTMLTemplate('admin/footer', null, null, function(data)
                        {
                            result = result.concat(data);
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
    var themesList = '';
    var firstTheme = null;

    fs.readdir(DOCUMENT_ROOT + '/plugins/themes', function(error, directory)
    {
        for(var sub in directory)
        {
            if(fs.existsSync(DOCUMENT_ROOT + '/plugins/themes/' + directory[sub] + '/details.json'))
            {
                var themeData = JSON.parse(fs.readFileSync(DOCUMENT_ROOT + '/plugins/themes/' + directory[sub] + '/details.json'));
                themesList = themesList.concat('<li id="' + themeData.uid + '_pill"><a href="javascript:loadThemeSettings(\'' + SITE_ROOT + '\', \'' + themeData.uid + '\')">' + themeData.name + '</a></li>');
                if(!firstTheme)
                {
                    firstTheme = themeData.uid;
                }
            }
        }
        
        getDBObjectsWithValues({object_type: 'setting', key: 'active_theme'}, function(data)
        {
            if(data.length > 0)
            {
                firstTheme = data[0]['value'];
            }
        
            output(themesList, firstTheme);
        });
    });
}
