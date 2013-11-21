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
        var x = a['caption'].toLowerCase();
        var y = b['caption'].toLowerCase();
    
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
    
    getHTMLTemplate('admin/content/media/manage_media/media_item', null, null, function(data)
    {
        mediaItemTemplate = data;
    
        for(var i = 0; i < media.length; i++)
        {
            var mediaItemElement = mediaItemTemplate.split('^media_id^').join(media[i]._id.toString());
            mediaItemElement = mediaItemElement.split('^media_icon^').join(instance.getMediaIcon(media[i].media_type));
            mediaItemElement = mediaItemElement.split('^media_caption^').join(media[i].caption);
            mediaItemElement = mediaItemElement.split('^media_thumb^').join(instance.getMediaThumb(media[i].media_type, media[i].location));
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

this.getMediaThumb = function(mediaType, mediaLocation)
{
    switch(mediaType)
    {
        case 'image':
            return '<img src="' + mediaLocation + '" style="max-height: 150px; max-width: 100%"></img>';
            break;
        case 'video/mp4':
        case 'video/webm':
        case 'video/ogg':
            return '<video style="max-height: 150px; max-width: 100%"><source src="' + mediaLocation + '" type="' + mediaType + '"></video>'
            break;
        case 'youtube':
            return '<img src="http://img.youtube.com/vi/' + mediaLocation + '/0.jpg" style="max-height: 150px; max-width: 100%"></img>';
            break;
        case 'vimeo':
            return '';
            break;
        case 'daily_motion':
            return '<img src="http://www.dailymotion.com/thumbnail/video/' + mediaLocation + '" style="max-height: 150px; max-width: 100%"></img>';
            break;
        default:
            return '';
            break;
    }
}
