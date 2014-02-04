/*

    Articles administration page
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.getPillNavOptions = function(activePill)
{
    var pillNavOptions = 
    [
        {
            name: 'new_article',
            title: '',
            icon: 'plus',
            href: '/admin/content/articles/new_article'
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

this.getTemplates = function(output)
{
    getDBObjectsWithValues({object_type: 'setting', key: 'active_theme'}, function(data)
    {
        if(data.length > 0)
        {
            fs.readdir(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/controllers', function(error, directory)
            {
                for(var file in directory)
                {
                    if(directory[file].indexOf('.js') > -1)
                    {
                        var templateFile = directory[file].substr(0, directory[file].indexOf('.js'));
                        availableTemplates.push(templateFile);
                    }
                }
                
                fs.readFile(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/details.json', function(error, data)
                {
                    if(error)
                    {
                        output('');
                        return;
                    }
                    
                    var details = JSON.parse(data);
                    output(details.content_templates);
                });
            });
        }
        else
        {
            output([]);
        }
    });
};

this.getMedia = function(output)
{
    var instance = this;
    
    getDBObjectsWithValues({object_type: 'media', $orderby: {name: 1}}, function(media)
    {
        for(var i = 0; i < media.length; i++)
        {
            media[i].icon = instance.getMediaIcon(media[i].media_type);
            media[i].link = instance.getMediaLink(media[i].media_type, media[i].location, media[i].is_file);
        }
        
        output(media);
    });
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
    output({redirect: pb.config.siteRoot + '/admin/content/articles/manage_articles'});
}
