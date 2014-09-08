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
        case 'storify':
            return '<iframe src="//storify.com/' + mediaObject.location + '/embed?header=false&border=false" width="100%" height="750" frameborder="0" allowtransparency="true"></iframe>';
    }
};

/**
 * Gets the proper CSS style for a media object
 *
 * @method getMediaStyleString
 * @param {String} template    Media embed HTML template
 * @param {String} styleString The style string from the article layout's media directive
 */
MediaService.getMediaStyle = function(template, styleString, mediaType) {
    var styleElements = styleString.split(',');
    var containerCSS  = [];
    var embedCSS      = [];
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
    
    if(mediaType === 'storify') {
        embedCSS.push('width: 100%');
    }

    template = template.split('^container_style^').join(containerCSS.join(';'));
    template = template.split('^media_style^').join(mediaCSS.join(';'));
    template = template.split('^embed_style^').join(embedCSS.join(';'));

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

//exports
module.exports = MediaService;
