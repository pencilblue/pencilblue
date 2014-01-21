/*

    Media administration page
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.getPillNavOptions = function(activePill)
{
    var pillNavOptions = 
    [
        {
            name: 'manage_media',
            title: '^loc_MANAGE_MEDIA^',
            icon: 'list-alt',
            href: '/admin/content/media/manage_media'
        },
        {
            name: 'add_media',
            title: '^loc_ADD_MEDIA^',
            icon: 'plus',
            href: '/admin/content/media/add_media'
        }
    ]
    
    if(typeof activePill !== 'undefined')
    {
        for(var i = 0; i < pillNavOptions.length; i++)
        {
            if(pillNavOptions[i].name == activePill)
            {
                pillNavOptions[i].active = 'active';
            }
        }
    }
    
    return pillNavOptions;
};

this.formatMedia = function(media)
{
    var instance = this;

    for(var i = 0; i < media.length; i++)
    {
        media[i].icon = instance.getMediaIcon(media[i].media_type);
        media[i].link = instance.getMediaLink(media[i].media_type, media[i].location, media[i].is_file);
    }
    
    return media;
};

this.getMediaIcon = function(mediaType)
{
    switch(mediaType)
    {
        case 'image':
            return 'picture-o';
            break;
        case 'video/mp4':
        case 'video/webm':
        case 'video/ogg':
            return 'film';
            break;
        case 'youtube':
            return 'youtube';
            break;
        case 'vimeo':
            return 'vimeo-square';
            break;
        case 'daily_motion':
            return 'play-circle-o';
            break;
        default:
            return 'question';
            break;
    }
};

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
                return pb.config.siteRoot + mediaLocation;
            }
            return mediaLocation;
    }
};

this.init = function(request, output)
{
    output({redirect: pb.config.siteRoot + '/admin/content/media/manage_media'});
}
