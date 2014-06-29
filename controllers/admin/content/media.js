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
 * Parent media controller
 */

function Media(){}

//inheritance
util.inherits(Media, pb.BaseController);

Media.prototype.render = function(cb) {
	cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/media/manage_media'));
};

Media.getPillNavOptions = function(activePill) {
    return [
        {
            name: 'add_media',
            title: '',
            icon: 'plus',
            href: '/admin/content/media/add_media'
        }
    ];
};

Media.formatMedia = function(media) {
    for(var i = 0; i < media.length; i++) {
        media[i].icon = Media.getMediaIcon(media[i].media_type);
        media[i].link = Media.getMediaLink(media[i].media_type, media[i].location, media[i].is_file);
    }
    return media;
};

Media.getMediaIcon = function(mediaType) {
    switch(mediaType) {
        case 'image':
            return 'picture-o';
            break;
        case 'video/mp4':
        case 'video/webm':
        case 'video/ogg':
            return 'film';
        case 'youtube':
            return 'youtube';
        case 'vimeo':
            return 'vimeo-square';
        case 'daily_motion':
            return 'play-circle-o';
        case 'vine':
            return 'vine';
        case 'instagram':
            return 'instagram';
        case 'slideshare':
            return 'list-alt';
        case 'trinket':
            return 'key fa-flip-horizontal';
        default:
            return 'question';
            break;
    }
};

Media.getMediaLink = function(mediaType, mediaLocation, isFile) {
    switch(mediaType) {
        case 'youtube':
            return 'http://youtube.com/watch/?v=' + mediaLocation;
        case 'vimeo':
            return 'http://vimeo.com/' + mediaLocation;
        case 'daily_motion':
            return 'http://dailymotion.com/video/' + mediaLocation;
        case 'vine':
            return 'https://vine.co/v/' + mediaLocation;
        case 'instagram':
            return 'http://instagram.com/p/' + mediaLocation;
        case 'slideshare':
            return 'http://www.slideshare.net/slideshow/embed_code/' + mediaLocation;
        case 'trinket':
            if(mediaLocation.indexOf('/') === -1) {
                return 'https://trinket.io/embed/python/' + mediaLocation;
            }
            return 'https://trinket.io/embed/' + mediaLocation;
        case 'image':
        case 'video/mp4':
        case 'video/webm':
        case 'video/ogg':
        default:
            if(isFile) {
                return pb.config.siteRoot + mediaLocation;
            }
            return mediaLocation;
    }
};

Media.getAll = function(cb) {

    var dao  = new pb.DAO();
    dao.query('media', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {name: 1}).then(function(media) {
    	if (util.isError(media)) {
    		//TODO properly handle this error
    		pb.log.warn("Media:getAll Error not properly handled: "+media);
    		media = [];
    	}

        for(var i = 0; i < media.length; i++) {
            media[i].icon = Media.getMediaIcon(media[i].media_type);
            media[i].link = Media.getMediaLink(media[i].media_type, media[i].location, media[i].is_file);
        }

        cb(media);
    });
};

//exports
module.exports = Media;
