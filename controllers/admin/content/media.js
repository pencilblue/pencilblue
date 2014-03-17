/**
 * Media - Media administration page
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Media(){}

//inheritance
util.inherits(Media, pb.BaseController);

Media.prototype.render = function(cb) {
	cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/media/manage_media'));
};

Media.getPillNavOptions = function(activePill) {
    var pillNavOptions = 
    [
        {
            name: 'add_media',
            title: '',
            icon: 'plus',
            href: '/admin/content/media/add_media'
        }
    ];
    
    if (typeof activePill !== 'undefined') {
        for (var i = 0; i < pillNavOptions.length; i++) {
            if(pillNavOptions[i].name == activePill) {
                pillNavOptions[i].active = 'active';
            }
        }
    }
    return pillNavOptions;
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
            return 'twitter'; //vine icon slated for fontawesome 4.1.0
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
