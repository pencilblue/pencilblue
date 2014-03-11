/**
 * TopMenuService - 
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.
 */
function TopMenuService(){}

TopMenuService.getTopMenu = function(session, localizationService, cb) {
    var self = this;
    var dao  = new pb.DAO();
    dao.query('pencilblue_theme_settings').then(function(data) {
        var themeSettings;
        
        if(util.isError(data) || data.length == 0) {
            themeSettings = {
                site_logo: pb.config.siteRoot + '/img/logo_menu.png',
                carousel_media: []
            };
        }
        else {
            themeSettings = data[0];
        }

        pb.settings.get('section_map', function(err, sectionMap) {            
            if (util.isError(err) || sectionMap == null) {
            	sectionMap = [];
            }
            
            var formattedSections = [];
            dao.query('section').then(function(sections) {
                //TODO handle error
                        
                for(var i = 0; i < sectionMap.length; i++) {
                    var section = self.getSectionData(sectionMap[i].uid, sections);
                    
                    if(sectionMap[i].children.length == 0) {
                        if(section) {
                            //TODO: figure out how to tell if were in one of these sections
                            formattedSections.push(section);
                        }
                    }
                    else {
                        section.dropdown = 'dropdown';
                    
                        if(section) {
                            var sectionHome = pb.utils.clone(section);
                            if(typeof loc !== 'undefined') {
                            	
                                sectionHome.name = sectionHome.name + ' ' + localizationService.localize([], '^loc_HOME^');
                            }
                            delete sectionHome.children;
                        
                            section.children = [sectionHome];
                            
                            for(var j = 0; j < sectionMap[i].children.length; j++) {
                                var child = self.getSectionData(sectionMap[i].children[j].uid, sections);
                                section.children.push(child);
                            }
                            
                            formattedSections.push(section);
                        }
                    }
                }
                
                pb.content.getSettings(function(err, contentSettings) {
                    var accountButtons = [];
                
                    if(contentSettings.allow_comments) {
                        if(session && session.authentication && session.authentication.user) {
                            accountButtons = [
                                {
                                    icon: 'user',
                                    href: '/user/manage_account'
                                },
                                {
                                    icon: 'rss',
                                    href: '/feed'
                                },
                                {
                                    icon: 'power-off',
                                    href: '/actions/logout'
                                }
                            ];
                            
                        }
                        else {
                            accountButtons =
                            [
                                {
                                    icon: 'user',
                                    href: '/user/sign_up'
                                },
                                {
                                    icon: 'rss',
                                    href: '/feed'
                                }
                            ];
                        }
                    }
                    
                    cb(themeSettings, formattedSections, accountButtons);
                });
            });
        });
    });
};

TopMenuService.getSectionData = function(uid, sections) {
    for(var i = 0; i < sections.length; i++) {
        if(sections[i]._id.equals(ObjectID(uid))) {
        	sections[i].url = pb.utils.urlJoin('section', sections[i].url);
            return sections[i];
        }
    }
    
    return null;
};

//exports
module.exports = TopMenuService;
