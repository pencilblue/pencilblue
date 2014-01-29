this.getTopMenu = function(session, output)
{
    var instance = this;
    
    getDBObjectsWithValues({object_type: 'pencilblue_theme_settings'}, function(data)
    {
        var themeSettings;
        
        if(data.length == 0)
        {
            themeSettings =
            {
                site_logo: pb.config.siteRoot + '/img/logo_menu.png',
                carousel_media: []
            };
        }
        else
        {
            themeSettings = data[0];
        }

        getDBObjectsWithValues({object_type: 'setting', key: 'section_map'}, function(data)
        {            
            var sectionMap = [];
            if (data.length > 0) {
            	sectionMap = data[0]['value'];
            }
            
            var formattedSections = [];
            getDBObjectsWithValues({object_type: 'section'}, function(data)
            {
                var sections = data;
                        
                for(var i = 0; i < sectionMap.length; i++)
                {
                    var section = instance.getSectionData(sectionMap[i].uid, sections);
                    
                    if(sectionMap[i].children.length == 0)
                    {
                        if(section)
                        {
                            //TODO: figure out how to tell if were in one of these sections
                            formattedSections.push(section);
                        }
                    }
                    else
                    {
                        section.dropdown = 'dropdown'
                    
                        if(section)
                        {
                            var sectionHome = clone(section);
                            if(typeof loc !== 'undefined')
                            {
                                sectionHome.name = sectionHome.name + ' ' + localize([], '^loc_HOME^');
                            }
                            delete sectionHome.children;
                        
                            section.children = [sectionHome];
                            
                            for(var j = 0; j < sectionMap[i].children.length; j++)
                            {
                                var child = instance.getSectionData(sectionMap[i].children[j].uid, sections);
                                child.url = section.url + '/' + child.url;
                                section.children.push(child);
                            }
                            
                            formattedSections.push(section);
                        }
                    }
                }
                
                getContentSettings(function(contentSettings)
                {
                    var accountButtons = [];
                
                    if(contentSettings.allow_comments)
                    {
                        if(session.user)
                        {
                            accountButtons =
                            [
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
                        else
                        {
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
                    
                    output(themeSettings, formattedSections, accountButtons);
                });
            });
        });
    });
}

this.getSectionData = function(uid, sections)
{
    for(var i = 0; i < sections.length; i++)
    {
        if(sections[i]._id.equals(ObjectID(uid)))
        {
            return sections[i];
        }
    }
    
    return null;
}
