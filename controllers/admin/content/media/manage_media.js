// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({content: ''});
            return;
        }
        
        getDBObjectsWithValues({object_type: 'media'}, function(data)
        {
            if(data.length == 0)
            {
                session.section = 'media';
                session.subsection = 'add_media';
                
                editSession(request, session, [], function(data)
                {
                    output({cookie: getSessionCookie(session), content: getJSTag('window.location = "' + SITE_ROOT + '/admin/content/media";')});
                });
                
                return;
            }
            
            var media = data;
        
            session.section = 'media';
            session.subsection = 'manage_media';
        
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('admin/content/media/manage_media', null, null, function(data)
                {
                    result = result.concat(data);
                    
                    displayErrorOrSuccess(session, result, function(newSession, newResult)
                    {
                        session = newSession;
                        result = newResult;
                        
                        instance.getMedia(media, function(mediaList)
                        {
                            result = result.split('^media^').join(mediaList);
                            
                            editSession(request, session, [], function(data)
                            {
                                output({cookie: getSessionCookie(session), content: localize(['admin', 'media'], result)});
                            });
                        });
                    });
                });
            });
        });
    });
}

this.getMedia = function(media, output)
{
    var mediaList = '';
    var mediaItemTemplate = ''
    var instance = this;
    
    // Case insensitive sort
    media.sort(function(a, b)
    {
        var x = a['name'].toLowerCase();
        var y = b['name'].toLowerCase();
    
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
    
    getHTMLTemplate('admin/content/media/manage_media/media_item', null, null, function(data)
    {
        mediaItemTemplate = data;
    
        for(var i = 0; i < media.length; i++)
        {
            var mediaItemElement = mediaItemTemplate.split('^media_id^').join(media[i]._id.toString());
            mediaItemElement = mediaItemElement.split('^media_name^').join(media[i].name);
            mediaItemElement = mediaItemElement.split('^media_icon^').join(instance.getMediaIcon(media[i].media_type));
            mediaItemElement = mediaItemElement.split('^media_caption^').join(media[i].caption);
            mediaItemElement = mediaItemElement.split('^media_link^').join(instance.getMediaLink(media[i].media_type, media[i].location, media[i].is_file));
            
            mediaList = mediaList.concat(mediaItemElement);
        }
    
        output(mediaList);
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
