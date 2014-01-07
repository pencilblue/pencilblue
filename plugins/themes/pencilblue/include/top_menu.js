this.setTopMenu = function(session, headTemplate, output)
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
            if(data.length == 0)
            {
                headTemplate = headTemplate.split('^section_map^').join('');
                output(headTemplate);
                return;
            }
            
            var sectionMap = data[0]['value'];
            
            getDBObjectsWithValues({object_type: 'section'}, function(data)
            {
                var sections = data;
            
                var buttonTemplate = '';
                var dropdownTemplate = '';
                var navLayout = '';
                
                getHTMLTemplate('elements/top_menu/button', null, null, function(data)
                {
                    buttonTemplate = data;
                    
                    getHTMLTemplate('elements/top_menu/dropdown', null, null, function(data)
                    {
                        dropdownTemplate = data;
                        
                        for(var i = 0; i < sectionMap.length; i++)
                        {
                            var section = instance.getSectionData(sectionMap[i].uid, sections);
                            
                            if(sectionMap[i].children.length == 0)
                            {
                                if(section)
                                {
                                    //TODO: figure out how to tell if were in one of these sections
                                    var button = buttonTemplate.split('^nav_active^').join('');
                                    button = button.split('^nav_href^').join(pb.config.siteRoot + '/' + section.url);
                                    button = button.split('^nav_title^').join(section.name);
                                    
                                    navLayout = navLayout.concat(button);
                                }
                            }
                            else
                            {
                                if(section)
                                {
                                    var dropdown = dropdownTemplate.split('^nav_active^').join('');
                                    dropdown = dropdown.split('^nav_href^').join(pb.config.siteRoot + '/' + section.url);
                                    dropdown = dropdown.split('^nav_title^').join(section.name);
                                    
                                    var buttons = buttonTemplate.split('^nav_active^').join('');
                                    buttons = buttons.split('^nav_href^').join(pb.config.siteRoot + '/' + section.url);
                                    buttons = buttons.split('^nav_title^').join(section.name + ' ^loc_HOME^');
                                    
                                    for(var j = 0; j < sectionMap[i].children.length; j++)
                                    {
                                        var childSection = instance.getSectionData(sectionMap[i].children[j].uid, sections);
                                        
                                        if(section)
                                        {
                                            var button = buttonTemplate.split('^nav_active^').join('');
                                            button = button.split('^nav_href^').join(pb.config.siteRoot + '/' + section.url + '/' + childSection.url);
                                            button = button.split('^nav_title^').join(childSection.name);
                                            
                                            buttons = buttons.concat(button);
                                        }
                                    }
                                    
                                    dropdown = dropdown.split('^children^').join(buttons);
                                    navLayout = navLayout.concat(dropdown);
                                }
                            }
                        }
                        
                        headTemplate = headTemplate.split('^site_logo^').join(themeSettings.site_logo);
                        headTemplate = headTemplate.split('^section_map^').join(navLayout);
                        output(themeSettings, headTemplate);
                    });
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
