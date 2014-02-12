// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_MANAGING_EDITOR}))
        {
            output({content: ''});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/pencilblue_settings', null, null, function(data)
            {
                result = result.concat(data);
                
                getDBObjectsWithValues({object_type: 'pencilblue_theme_settings'}, function(data)
                {
                    var settings;
                    if(data.length == 0)
                    {
                        settings =
                        {
                            site_logo: pb.config.siteRoot + '/img/logo_menu.png',
                            carousel_media: []
                        };
                    }
                    else
                    {
                        settings = data[0];
                        settings.carousel = settings.carousel_media.join(',');
                    }
                    
                    session = setFormFieldValues(settings, session);
                    
                    result = result.split('^image_title^').join('^loc_SITE_LOGO^');
                    result = result.split('^uploaded_image^').join(settings.site_logo);
                    
                    var tabs =
                    [
                        {
                            active: 'active',
                            href: '#settings',
                            icon: 'cog',
                            title: '^loc_SETTINGS^'
                        },
                        {
                            href: '#carousel',
                            icon: 'picture-o',
                            title: '^loc_CAROUSEL^'
                        }
                    ];
                        
                    require('../../../../../controllers/admin/content/articles').getMedia(function(media)
                    {
                        prepareFormReturns(session, result, function(newSession, newResult)
                        {
                            session = newSession;
                            result = newResult;
                            
                            result = result.concat(pb.js.getAngularController({tabs: tabs, media: media}));
                    
                            editSession(request, session, [], function(data)
                            {
                                output({content: localize(['admin', 'themes', 'media', 'pencilblue_settings'], result)});
                            });
                        });
                    });
                });
            });
        });
    });
}
