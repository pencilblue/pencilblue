/**
 * Themes - Retrieve the header, body, and footer and return them to the router
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Themes(){}

//inheritance
util.inherits(Themes, pb.BaseController);

//constants
var PATH_TO_THEME_DIR = DOCUMENT_ROOT + '/plugins/';

Themes.prototype.render = function(cb) {
	var self = this;
	
	this.setPageName('Themes');
	self.ts.load('admin/plugins/themes', function(err, data) {
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
                navigation: pb.AdminNavigation.get(self.session, ['plugins', 'themes'], self.ls),
                pills: themes, 
                themeSettingsURL: themeSettingsURL
            }));
                   
            cb({content: result});
        });
    });
};

Themes.prototype.getThemes = function(cb) {
	var themes = [];
    
    fs.readdir(PATH_TO_THEME_DIR, function(err, directory) {
    	if (util.isError(err)) {
    		cb(themes);
    		pb.log.warn("Themes: Failed to read directory ["+PATH_TO_THEME_DIR+']');
    		return;
    	}
    	
        for (var sub in directory) {
        	
        	var subDirPath = path.join(PATH_TO_THEME_DIR, directory[sub]);
        	var details    = subDirPath + '/details.json';
            if(fs.existsSync(details)) {
                
            	var themeData = {};
            	try {
            		themeData = JSON.parse(fs.readFileSync(details));
            	}
            	catch(e){
            		pb.log.warn("Themes: Failed to parse details file:"+subDirPath);
            	}

                if(themeData.settings && typeof themeData.settings_controller === 'string') {
                    
                	var controllerPath = path.join(subDirPath, themeData.settings_controller);
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
                	else {
                		pb.log.warn("Themes: Failed to parse details file: [%s]", details);
                	}
                }
                else {
                	pb.log.warn("Themes: Failed to retrieve settings from details file: [%s]", details);
                }
            }
            else {
            	pb.log.warn("Themes: Failed to read details file: [%s]", details);
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

//exports
module.exports = Themes;
