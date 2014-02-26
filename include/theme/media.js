/**
 * MediaService
 * TODO: add options like sizing
 * TODO: move hard coded HTML to template
 */
function MediaService(){}

MediaService.getMediaEmbed = function(mediaObject, options)
{
    switch(mediaObject.media_type)
    {
        case 'image':
            return '<img class="img-responsive" src="' + mediaObject.location + '" style="^media_style^"></img>';
        case 'youtube':
            return '<iframe width="560" height="315" src="//www.youtube.com/embed/' + mediaObject.location + '" frameborder="0" allowfullscreen></iframe>';
        case 'vimeo':
            return '<iframe src="//player.vimeo.com/video/' + mediaObject.location + '" width="500" height="281" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
        case 'daily_motion':
            return '<iframe frameborder="0" width="480" height="270" src="http://www.dailymotion.com/embed/video/' + mediaObject.location + '"></iframe>';
    }
};

MediaService.getMediaStyle = function(template, styleString)
{
    var styleElements = styleString.split(',');
    var containerCSS = [];
    var mediaCSS = [];
    
    for(var i = 0; i < styleElements.length; i++)
    {
        var styleSetting = styleElements[i].split(':');
        
        switch(styleSetting[0])
        {
            case 'position':
                switch(styleSetting[1])
                {
                    case 'left':
                        containerCSS.push('float: left');
                        containerCSS.push('margin-right: 1em');
                        break;
                    case 'right':
                        containerCSS.push('float: right');
                        containerCSS.push('margin-left: 1em');
                        break;
                    case 'center':
                    default:
                        containerCSS.push('text-align: center');
                        break;
                }
                break;
            case 'maxheight':
                mediaCSS.push('max-height: ' + styleSetting[1]);
                break;
            default:
                break;
        }
    }
    
    template = template.split('^container_style^').join(containerCSS.join(';'));
    template = template.split('^media_style^').join(mediaCSS.join(';'));
    
    return template;
};

MediaService.getCarousel = function(carouselMedia, template, tagToReplace, carouselID, output)
{
    var instance = this;

    if(carouselMedia.length == 0)
    {
        output(template.split('^carousel^').join(''));
        return;
    }

    var mediaOptions = [];
    for(var i = 0; i < carouselMedia.length; i++)
    {
        mediaOptions.push({_id: ObjectID(carouselMedia[i])});
    }
    
    getDBObjectsWithValues({object_type: 'media', $or: mediaOptions}, function(data)
    {
        if(data.length == 0)
        {
            output(template.split(tagToReplace).join(''));
            return;
        }
        
        var carouselItems = data;
        carouselItemTemplate = '';
        
        pb.templates.load('elements/carousel', null, null, function(data)
        {
            template = template.split(tagToReplace).join(data);
            template = template.split('^carousel_id^').join(carouselID);
            
            pb.templates.load('elements/carousel/item', null, null, function(data)
            {
                carouselItemTemplate = data;
            
                var carouselIndicators = '';
                var carouselContent = '';
            
                for(var i = 0; i < carouselItems.length; i++)
                {
                    if(carouselItems.length > 1)
                    {
                        carouselIndicators = carouselIndicators.concat('<li data-target="#' + carouselID + '" data-slide-to="' + i + '" ' + ((i == 0) ? 'class="active"' : '') + '></li>');
                    }
                    
                    var item = carouselItemTemplate.split('^item_media^').join(instance.getMediaEmbed(carouselItems[i]));
                    item = item.split('^item_caption^').join(carouselItems[i].caption);
                    item = item.split('^item_active^').join((i == 0) ? 'active' : '');
                    
                    carouselContent = carouselContent.concat(item);
                }
                
                if(carouselItems.length == 1)
                {
                    template = template.split('^carousel_arrows^').join('');
                }
                else
                {
                    template = template.split('^carousel_arrows^').join('<a class="left carousel-control" href="#' + carouselID + '" data-slide="prev"><span class="glyphicon glyphicon-chevron-left"></span></a><a class="right carousel-control" href="#' + carouselID + '" data-slide="next"><span class="glyphicon glyphicon-chevron-right"></span></a>');
                }
                
                template = template.split('^carousel_indicators^').join(carouselIndicators);
                template = template.split('^carousel_content^').join(carouselContent);
                output(template);
            });
        });
    });
};

//exports
module.exports = MediaService;
