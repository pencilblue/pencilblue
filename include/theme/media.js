/*
    Copyright (C) 2014  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * TODO: add options like sizing
 * TODO: move hard coded HTML to template
 */

/**
 * Retrieves media information
 *
 * @module Services
 * @submodule Theme
 * @class MediaService
 * @constructor
 */
function MediaService(){}

/**
 * Retrieves the correct embed HTML for a media object
 *
 * @method getMediaEmbed
 * @param {Object} mediaObject
 */
MediaService.getMediaEmbed = function(mediaObject, options) {
    switch(mediaObject.media_type) {
        case 'image':
            return '<img class="img-responsive" src="' + mediaObject.location + '" style="^media_style^"/>';

        case 'youtube':
            return '<iframe width="560" height="315" src="//www.youtube.com/embed/' + mediaObject.location + '" frameborder="0" allowfullscreen></iframe>';

        case 'vimeo':
            return '<iframe src="//player.vimeo.com/video/' + mediaObject.location + '" width="500" height="281" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';

        case 'daily_motion':
            return '<iframe frameborder="0" width="480" height="270" src="http://www.dailymotion.com/embed/video/' + mediaObject.location + '"></iframe>';

        case 'vine':
            return '<iframe class="vine-embed" src="https://vine.co/v/' + mediaObject.location + '/embed/simple" width="400" height="400"  frameborder="0"></iframe>';

        case 'instagram':
            return '<iframe src="//instagram.com/p/' + mediaObject.location + '/embed/" width="400" height="475" frameborder="0" scrolling="no" allowtransparency="true"></iframe>';
        case 'slideshare':
            return '<iframe src="http://www.slideshare.net/slideshow/embed_code/' + mediaObject.location + '" width="427" height="356" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" allowfullscreen></iframe>';
        case 'trinket':
            if(mediaObject.location.indexOf('/') === -1) {
                return '<iframe src="https://trinket.io/embed/python/' + mediaObject.location + '" width="600" height="400" frameborder="0" marginwidth="0" marginheight="0" allowfullscreen></iframe>';
            }
            return '<iframe src="https://trinket.io/embed/' + mediaObject.location + '" width="600" height="400" frameborder="0" marginwidth="0" marginheight="0" allowfullscreen></iframe>';
    }
};

/**
 * Gets the proper CSS style for a media object
 *
 * @method getMediaStyleString
 * @param {String} template    Media embed HTML template
 * @param {String} styleString The style string from the article layout's media directive
 */
MediaService.getMediaStyle = function(template, styleString) {
    var styleElements = styleString.split(',');
    var containerCSS  = [];
    var mediaCSS      = [];

    for(var i = 0; i < styleElements.length; i++) {
        var styleSetting = styleElements[i].split(':');

        switch(styleSetting[0]) {
            case 'position':
                MediaService.onStyleSettingPosition(containerCSS, styleSetting[1]);
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

MediaService.onStyleSettingPosition = function(containerCSS, position) {
	switch(position) {

		case 'left':
            containerCSS.push('float: left');
            containerCSS.push('margin-right: 1em');
            break;

        case 'right':
            containerCSS.push('float: right');
            containerCSS.push('margin-left: 1em');
            break;
        case 'center':
            containerCSS.push('text-align: center');
            break;
        default:
            break;
    }
};

MediaService.getCarousel = function(carouselMedia, template, tagToReplace, carouselID, cb) {
    var instance = this;

    if(carouselMedia.length === 0) {
        cb(template.split('^carousel^').join(''));
        return;
    }

    //query for media
    var dao = new pb.DAO();
    dao.query('media', pb.DAO.getIDInWhere(carouselMedia)).then(function(carouselItems) {
        if(util.isError(carouselItems) || !carouselItems.length) {
            cb(template.split(tagToReplace).join(''));
            return;
        }

        var ts = new pb.TemplateService();
        ts.load('elements/carousel', function(err, data) {
            if (util.isError(err)) {
                pb.log.error("Media: An Error occurred attempting to load the carousel template: %s", err.stack);
                data = data || '';
            }

            template = template.split(tagToReplace).join(data);
            template = template.split('^carousel_id^').join(carouselID);

            ts.load('elements/carousel/item', function(err, data) {
                if (util.isError(err)) {
                    pb.log.error("Media: An Error occurred attempting to load the carousel template: %s", err.stack);
                    data = data || '';
                }

                var carouselItemTemplate = '' + data;

                var carouselIndicators = '';
                var carouselContent    = '';

                for(var i = 0; i < carouselItems.length; i++) {
                    if(carouselItems.length > 1) {
                        carouselIndicators += '<li data-target="#' + carouselID + '" data-slide-to="' + i + '" ' + ((i === 0) ? 'class="active"' : '') + '></li>';
                    }

                    var item = carouselItemTemplate.split('^item_media^').join(instance.getMediaEmbed(carouselItems[i]))
                    .split('^item_caption^').join(carouselItems[i].caption)
                    .split('^item_active^').join((i === 0) ? 'active' : '');

                    carouselContent = carouselContent.concat(item);
                }

                if(carouselItems.length == 1) {
                    template = template.split('^carousel_arrows^').join('');
                }
                else {
                	var anchors = '<a class="left carousel-control" href="#' + carouselID + '" data-slide="prev"><span class="glyphicon glyphicon-chevron-left"></span></a><a class="right carousel-control" href="#' + carouselID + '" data-slide="next"><span class="glyphicon glyphicon-chevron-right"></span></a>';
                    template = template.split('^carousel_arrows^').join(anchors);
                }

                template = template.split('^carousel_indicators^').join(carouselIndicators);
                template = template.split('^carousel_content^').join(carouselContent);
                cb(template);
            });
        });
    });
};

//exports
module.exports = MediaService;
