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
        
        session.section = 'themes';
        session.subsection = 'pencilblue';
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/pencilblue_settings', null, null, function(data)
            {
                result = result.concat(data);
                
                var tabs =
                [
                    {
                        active: true,
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
                
                getTabNav(tabs, function(tabNav)
                {
                    result = result.split('^tab_nav^').join(tabNav);
                    
                    instance.getMediaOptions(function(mediaList)
                    {
                        result = result.split('^media_options^').join(mediaList);
                    
                        displayErrorOrSuccess(session, result, function(newSession, newResult)
                        {
                            session = newSession;
                            result = newResult;
                    
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

this.getMediaOptions = function(output)
{
    var mediaList = '';
    var mediaTemplate = '';
    var instance = this;
    
    getDBObjectsWithValues({object_type: 'media'}, function(data)
    {
        var media = data;
        
        // Case insensitive sort
        media.sort(function(a, b)
        {
            var x = a['name'].toLowerCase();
            var y = b['name'].toLowerCase();
        
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
        
        getHTMLTemplate('admin/content/articles/new_article/media', null, null, function(data)
        {
            mediaItemTemplate = data;
        
            for(var i = 0; i < media.length; i++)
            {
                var mediaItemElement = mediaItemTemplate.split('^media_id^').join(media[i]._id.toString());
                mediaItemElement = mediaItemElement.split('^media_name^').join(media[i].name);
                mediaItemElement = mediaItemElement.split('^media_icon^').join(instance.getMediaIcon(media[i].media_type));
                mediaItemElement = mediaItemElement.split('^media_caption^').join(media[i].caption);
                mediaItemElement = mediaItemElement.split('^media_link^').join(instance.getMediaLink(media[i].media_type, media[i].location, media[i].is_file));
                mediaItemElement = mediaItemElement.split('^spacer^').join((i % 4 == 3) ? '<div class="spacer"></div>' : '');
                
                mediaList = mediaList.concat(mediaItemElement);
            }
        
            output(mediaList);
        });
    });
}

this.getMediaIcon = function(mediaType)
{
    var iconID = '';

    switch(mediaType)
    {
        case 'image':
            iconID = 'picture-o';
            break;
        case 'video/mp4':
        case 'video/webm':
        case 'video/ogg':
            iconID = 'film';
            break;
        case 'youtube':
            iconID = 'youtube';
            break;
        case 'vimeo':
            iconID = 'vimeo-square';
            break;
        case 'daily_motion':
            iconID = 'play-circle-o';
            break;
        default:
            iconID = 'question';
            break;
    }
    
    return '<i class="fa fa-' + iconID + '"></i>';
}

this.getMediaLink = function(mediaType, mediaLocation, isFile)
{
    switch(mediaType)
    {
        case 'youtube':
            return 'http://youtube.com/watch/?v=' + mediaLocation;
        case 'vimeo':
            return 'http://vimeo.com/' + mediaLocation;
        case 'daily_motion':
            return 'http://dailymotion.com/video/' + mediaLocation;
        case 'image':
        case 'video/mp4':
        case 'video/webm':
        case 'video/ogg':
        default:
            if(isFile)
            {
                return SITE_ROOT + mediaLocation;
            }
            return mediaLocation;
    }
}
