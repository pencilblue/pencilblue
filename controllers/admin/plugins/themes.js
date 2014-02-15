/**
 * Themes - Retrieve the header, body, and footer and return them to the router
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Themes(){}

//inheritance
util.inherits(Themes, pb.BaseController);

Themes.prototype.render = function(cb) {
	var self = this;
	
	pb.templates.load('admin/plugins/themes', 'Themes', null, function(data) {
        var result = '' + data;
            
        self.getThemes(function(themes) {
        	
        	var themeSettingsURL = null;
            for(var i = 0; i < themes.length; i++) {
                if(themes[i].active) {
                    result = result.split('^active_theme_settings^').join(themes[i].settingsURL);
                    themeSettingsURL = themes[i].settingsURL;
                    break;
                }
            }
            
            result = result.concat(pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['plugins', 'themes']),
                pills: themes, 
                themeSettingsURL: themeSettingsURL
            }));
                   
            var content = self.localizationService.localize(['admin', 'themes'], result);
            cb({content: content});
        });
    });
};

Themes.prototype.getThemes = function(cb) {
	var themes = [];
    
    fs.readdir(DOCUMENT_ROOT + '/plugins/themes', function(err, directory) {
    	if (util.isError(err)) {
    		cb(themes);
    		pb.log.warning("Themes: Failed to read directory ["+DOCUMENT_ROOT + '/plugins/themes]');
    		return;
    	}
    	
        for (var sub in directory) {
        	
        	var subDirPath = DOCUMENT_ROOT + '/plugins/themes/' + directory[sub];
        	var details    = subDirPath + '/details.json';
            if(fs.existsSync(details)) {
                
            	var themeData = JSON.parse(fs.readFileSync(details));
                if(themeData.settings) {
                    
                	var controllerPath = subDirPath + '/controllers' + themeData.settings + '.js';
                	if(fs.existsSync(controllerPath)) {
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
        
        pb.settings.get('active_theme', function(err, activeTheme) {
            if(activeTheme != null) {
            	if (themes.length > 0) {
            		themes[0].active = 'active';
            	}
            }
            
            for(var i = 0; i < themes.length; i++) {
                if(themes[i].name == activeTheme) {
                    themes[i].active = 'active';
                }
            }
        
            cb(themes);
        });
    });
};

Themes.init = function(request, output)
{
    var result = '';
    
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
                    
                Themes.getThemes(function(themes)
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
                    
                    result = result.concat(pb.js.getAngularController(
                    {
                        navigation: getAdminNavigation(session, ['plugins', 'themes']),
                        pills: themes, themeSettingsURL: themeSettingsURL
                    }));
                           
                    editSession(request, session, [], function(data)
                    {
                        output({cookie: getSessionCookie(session), content: localize(['admin', 'themes'], result)});
                    });
                });
            });
        });
    });
};

Themes.getThemes = function(output)
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
};

//exports
module.exports = Themes;
