global.initLocalization = function(request, session, output)
{
    var getParameters = getQueryParameters(request);
    if(getParameters['language'])
    {
        session.language = getParameters['language'];
    }
    else if(!session.language)
    {
        session.language = 'en';
    }
    
    fs.exists(DOCUMENT_ROOT + 'public/localization/' + session.language + '.js', function(exists)
    {
        if(!exists)
        {
            session.language = 'en';
        }
        
        require('./../public/localization/' + session.language);
        
        getDBObjectsWithValues({object_type: 'setting', key: 'active_theme'}, function(data)
        {
            if(data.length > 0)
            {
                if(fs.existsSync(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/public/loc/' + session.language + '.js'))
                {
                    require('./../plugins/themes/' + data[0]['value'] + '/public/loc/' + session.language);
                }
            }
        
            editSession(request, session, [], function(data)
            {
                output(true);
            });
        });
    });
}

global.localize = function(sets, text)
{
    for(var key in loc.generic)
    {
        text = text.split('^loc_' + key + '^').join(loc.generic[key]);
    }
    
    for(var i = 0; i < sets.length; i++)
    {
        for(var key in loc[sets[i]])
        {
            text = text.split('^loc_' + key + '^').join(loc[sets[i]][key]);
        }
    }
    
    // If the localization is for HTML output, load the localization into client side JS
    if(text.indexOf('<body') > -1)
    {
        text = text.concat(includeJS(SITE_ROOT + '/localization/' + localizationLanguage + '.js'));
    }
    
    return text;
}
