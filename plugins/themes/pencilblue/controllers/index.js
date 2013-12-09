/*

    Index page of the pencilblue theme
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getDBObjectsWithValues({object_type: 'user'}, function(data)
    {
        if(data.length == 0)
        {
            output({redirect: SITE_ROOT + '/setup'});
            return;
        }
    
        getSession(request, function(session)
        {
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('head', 'Home', null, function(data)
                {
                    require('../include/section_map.js').setSectionMap(data, function(siteSettings, headLayout)
                    {
                        result = result.concat(headLayout);
                        getHTMLTemplate('index', null, null, function(data)
                        {
                            result = result.concat(data);
                            
                            instance.getCarousel(siteSettings.carousel_media, result, function(newResult)
                            {
                                result = newResult;
                            
                                getHTMLTemplate('footer', null, null, function(data)
                                {
                                    result = result.concat(data);
                                    output({cookie: getSessionCookie(session), content: localize(['pencilblue_generic'], result)});
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

this.getCarousel = function(carouselMedia, template, output)
{
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
            output(template.split('^carousel^').join(''));
            return;
        }
        
        var carouselItems = data;
        carouselItemTemplate = '';
        
        getHTMLTemplate('elements/carousel', null, null, function(data)
        {
            template = template.split('^carousel^').join(data);
            
            getHTMLTemplate('elements/carousel/item', null, null, function(data)
            {
                carouselItemTemplate = data;
            
                var carouselIndicators = '';
                var carouselContent = '';
            
                for(var i = 0; i < carouselItems.length; i++)
                {
                    if(carouselItems.length > 1)
                    {
                        carouselIndicators = carouselIndicators.concat('<li data-target="#index_carousel" data-slide-to="' + i + '" ' + ((i == 0) ? 'class="active"' : '') + '></li>');
                    }
                    
                    var item = carouselItemTemplate.split('^item_media^').join(getMediaEmbed(carouselItems[i]));
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
                    template = template.split('^carousel_arrows^').join('<a class="left carousel-control" href="#index_carousel" data-slide="prev"><span class="glyphicon glyphicon-chevron-left"></span></a><a class="right carousel-control" href="#index_carousel" data-slide="next"><span class="glyphicon glyphicon-chevron-right"></span></a>');
                }
                
                template = template.split('^carousel_indicators^').join(carouselIndicators);
                template = template.split('^carousel_content^').join(carouselContent);
                output(template);
            });
        });
    });
}
