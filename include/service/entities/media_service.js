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

//dependencies
var http = require('http');

/**
 * Provides information on media
 *
 * @module Services
 * @submodule Entities
 * @class MediaService
 * @constructor
 */
function MediaService(){

    /**
     * @property provider
     */
    this.provider = null;

    if (pb.config.media.provider === 'fs') {
        this.provider = new pb.FsMediaProvider(pb.config.media.parent_dir);
    }
    else {

        var paths = [path.join(DOCUMENT_ROOT, pb.config.media.provider), pb.config.media.provider];
        for(var i = 0; i < paths.length; i++) {
            try{
                var ProviderType = require(paths[i]);
                this.provider = new ProviderType();
                break;
            }
            catch(e){
                pb.log.silly(e.stack);
            }
        }

        if (this.provider == null) {
            throw new Error('A valid media provider was not available: PROVIDER_PATH: '+pb.config.media.provider+' TRIED='+JSON.stringify(paths));
        }
    }
};

MediaService.COLL = 'media';

MediaService.prototype.loadById = function(mid, cb) {
    var dao = new pb.DAO();
    dao.loadById(mid.toString(), MediaService.COLL, cb);
};

MediaService.prototype.deleteById = function(mid, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb     = options;
        optons = {delete_content: true};
    }

    var self = this;
    var dao  = new pb.DAO();
    dao.deleteById(mid, MediaService.COLL, cb);
};

MediaService.prototype.get = function(options, cb) {
    if (pb.utils.isFunction(options)) {
        cb      = options;
        options = {
            format_media: true,
            order: {name: 1}
        };
    }

    var dao  = new pb.DAO();
    dao.query('media', options.where, options.select, options.order, options.limit, options.offset).then(function(media) {
    	if (util.isError(media)) {
    		return cb(media, []);
    	}

        //set the link and icon if specified
        if (options.format_media) {
            MediaService.formatMedia(media);
        }
        cb(null, media);
    });
};

MediaService.prototype.getContentByPath = function(mediaPath, cb) {
    this.provider.get(mediaPath, cb);
};

MediaService.prototype.getContentStreamByPath = function(mediaPath, cb) {
    this.provider.getStream(mediaPath, cb);
};

MediaService.prototype.setContent = function(fileDataStrOrBuff, fileName, cb) {
    var mediaPath = MediaService.generateMediaPath(fileName);
    this.provider.set(fileDataStrOrBuff, mediaPath, function(err, result) {
        cb(err, { mediaPath: mediaPath, result: result});
    });
};

MediaService.prototype.setContentStream = function(stream, fileName, cb) {
    var mediaPath = MediaService.generateMediaPath(fileName);
    this.provider.setStream(stream, mediaPath, function(err, result) {
        cb(err, { mediaPath: mediaPath, result: result});
    });
};

MediaService.prototype.createContentWriteStream = function(fileName, cb) {
    var mediaPath = MediaService.generateMediaPath(fileName);
    this.provider.createWriteStream(mediaPath, function(err, stream) {
        var result = {
            mediaPath: mediaPath,
            stream: stream
        };
        cb(err, result);
    });
};

MediaService.prototype.existsByPath = function(mediaPath, cb) {
    this.provider.exists(mediaPath, cb);
};

MediaService.prototype.deleteContentByPath = function(mediaPath, cb) {
    this.provider.delete(mediaPath, cb);
};

MediaService.prototype.statByPath = function(mediaPath, cb) {
    this.provider.stat(mediaPath, cb);
};

/**
 * Retrieves whether a media's file path is valid
 *
 * @method isValidFilePath
 * @param {String}   mediaPath The file path of the media
 * @param {Function} cb        Callback function
 */
MediaService.prototype.isValidFilePath = function(mediaPath, cb) {
	var absolutePath = path.join(DOCUMENT_ROOT, 'public', mediaPath);
	fs.exists(absolutePath, function(exists) {
		cb(null, exists);
	});
};

MediaService.prototype.getMediaDescriptor = function(mediaURL, isFile, cb) {
    var self = this;

    var fileType = null;
    var index    = mediaURL.lastIndexOf('.');
    if (index >= 0) {
        fileType = mediaURL.substr(index + 1).toLowerCase();
    }

    var descriptor = {
        url: mediaURL,
        is_file: isFile,
    };

    switch(fileType) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'svg':
        case 'webp':
            descriptor.media_type = 'image';
            break;
        case 'mp4':
            descriptor.media_type = 'video/mp4';
            break;
        case 'webm':
            descriptor.media_type = 'video/webm';
            break;
        case 'ogv':
            descriptor.media_type = 'video/ogg';
    }

    //when the media type has been discovered we are done so we check to see if
    //phase 1 took care of it for us
    if (descriptor.media_type) {
        descriptor.location = mediaURL;
        return cb(null, descriptor);
    }

    //we got here so we need to inspect the URL more closely.  We need to check
    //for specific sites.
    var implementations = {

        'youtube.com': function(descriptor, cb) {

            if(mediaURL.indexOf('v=') != -1) {

                var videoID = mediaURL.substr(mediaURL.indexOf('v=') + 2);
                if(videoID.indexOf('&') != -1) {
                    videoID = videoID.substr(0, videoID.indexOf('&'));
                }

                descriptor.media_type = 'youtube';
                descriptor.location   = videoID;
            }
            cb();
        },

        'youtu.be': function(descriptor, cb) {

            if(mediaURL.indexOf('/') != -1) {

                var videoID = mediaURL.substr(mediaURL.lastIndexOf('/') + 1);
                if(videoID.indexOf('&') != -1) {
                    videoID = videoID.substr(0, videoID.indexOf('&'));
                }

                descriptor.media_type = 'youtube';
                descriptor.location   = videoID;
            }
            cb()
        },

        'vimeo.com': function(descriptor, cb) {

            if(mediaURL.indexOf('/') != -1) {
                var videoID = mediaURL.substr(mediaURL.lastIndexOf('/') + 1);
                if(videoID.indexOf('&') != -1) {
                    videoID = videoID.substr(0, videoID.indexOf('&'));
                }
                descriptor.media_type = 'vimeo';
                descriptor.location   = videoID;
            }
            cb();
        },

        'dailymotion.com/video/': function(descriptor, cb) {

            var videoID = mediaURL.substr(mediaURL.lastIndexOf('/') + 1);
            if(videoID.indexOf('&') != -1) {
                videoID = videoID.substr(0, videoID.indexOf('&'));
            }

            descriptor.media_type = 'daily_motion';
            descriptor.location   = videoID;
            cb();
        },

        'dai.ly': function(descriptor, cb) {
            if(mediaURL.indexOf('/') != -1) {
                var videoID = mediaURL.substr(mediaURL.lastIndexOf('/') + 1);
                if(videoID.indexOf('&') != -1) {
                    videoID = videoID.substr(0, videoID.indexOf('&'));
                }

                descriptor.media_type = 'daily_motion';
                descriptor.location   = videoID;
            }
            cb();
        },

        'vine.co': function(descriptor, cb) {

            var mediaURL = mediaURL.split('/embed').join('');
            var videoID = mediaURL.substr(mediaURL.lastIndexOf('/') + 1);
            if(videoID.indexOf('&') != -1) {
                videoID = videoID.substr(0, videoID.indexOf('&'));
            }

            descriptor.media_type = 'vine';
            descriptor.location   = videoID;
            cb();
        },

        'instagram.com': function(descriptor, cb) {

            if(mediaURL.substr(mediaURL.length - 1) == '/') {
                mediaURL = mediaURL.substr(0, mediaURL.length - 1);
            }

            var videoID = mediaURL.substr(mediaURL.lastIndexOf('/') + 1);
            if(videoID.indexOf('&') != -1) {
                videoID = videoID.substr(0, videoID.indexOf('&'));
            }

            descriptor.media_type = 'instagram';
            descriptor.location   = videoID;
            cb();
        },

        'slideshare.net': function(descriptor, cb) {

            if(mediaURL.substr(mediaURL.length - 1) == '/') {
                mediaURL = mediaURL.substr(0, mediaURL.length - 1);
            }

            self.getSlideShareId(mediaURL, function(err, slideShowID) {
                if (util.isError(err)) {
                    pb.log.error('Failed to get slide show ID from SlideShare. M_URL=[%s] Error=\n%s', mediaURL, err.stack);
                    return cb();
                }
                else if(slideshowID) {
                    descriptor.media_type = 'slideshare';
                    descriptor.location   = videoID;
                }
                cb();
            });
        },

        'trinket.io': function() {
            var mediaID;
            if(mediaURL.indexOf('/embed') != -1) {
                mediaID = mediaURL.substr(mediaURL.lastIndexOf('/embed') + 7);
            }
            else {
                mediaID = mediaURL.substr(mediaURL.lastIndexOf('trinket.io') + 11);
            }

            descriptor.media_type = 'trinket';
            descriptor.location   = videoID;
            cb();
        },

        'storify.com': function() {
            var mediaID = mediaURL.substr(mediaURL.indexOf('storify.com') + 12);

            descriptor.media_type = 'storify';
            descriptor.location   = videoID;
            cb();
        }
    };

    var cnt  = 0;
    var keys = Object.keys(implementations);
    async.whilst(
        function() { return cnt < keys.length && !descriptor.media_type; },
        function(callback) {

            var key  = keys[cnt++];
            var impl = implementations[key](descriptor, callback);
        },
        function(err) {
            if (util.isError(err)) {
                return cb(err);
            }

            self.getMediaThumb(descriptor.media_type, descriptor.location, function(err, thumb) {
                descriptor.thumb = thumb;
                cb(err, descriptor);
            });
        }
    );
}

MediaService.prototype.getMediaThumb = function(type, location, cb) {

    switch(type) {
        case 'image':
        case 'video/mp4':
        case 'video/webm':
        case 'video/ogg':
            cb(null, location);
            break;
        case 'youtube':
            cb(null, 'http://img.youtube.com/vi/' + location + '/0.jpg');
            break;
        case 'vimeo':
            this.getVimeoThumb(location, cb);
            break;
        case 'daily_motion':
            cb(null, 'http://www.dailymotion.com/thumbnail/video/' + location);
            break;
        case 'vine':
            cb(null, '');
            break;
        case 'instagram':
            cb(null, '');
            break;
        case 'slideshare':
            cb(null, location);
            break;
        case 'trinket':
            cb(null, '');
            break;
        case 'storify':
            cb(null, '');
            break;
        default:
            cb(null, '');
            break;
    }
};

MediaService.prototype.getVimeoThumb = function(location, cb) {

    var options = {
        host: 'vimeo.com',
        path: '/api/v2/video/' + location + '.json'
    };
    var callback = function(response) {
        var str = '';

        //another chunk of data has been recieved, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
            try {
                var data = JSON.parse(str);
                cb(null, data[0].thumbnail_medium);
            }
            catch(err) {
                cb(err);
            }
        });
    };
    http.request(options, callback).end();
};

MediaService.prototype.getSlideShareId = function(mediaURL, cb) {
    var options = {
        host: 'www.slideshare.net',
        path: '/api/oembed/2?url=' + mediaURL + '&format=jsonp&callback=?'
    };
    var callback = function(response) {
        var str = '';

        //another chunk of data has been recieved, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
            try {
                var data = JSON.parse(str);
                cb(null, data.slideshow_id);
            }
            catch(err) {
                cb(err);
            }
        });
    };
    http.request(options, callback).end();
};

MediaService.getMediaFlag = function(mid, options) {
    if (!mid) {
        throw new Error('The media id is required but ['+mid+'] was provided');
    }
    else if (!pb.utils.isObject(options)) {
        options = {};
    }

    var flag = '^media_display_'+mid+'/';

    var cnt = 0;
    for (var opt in options) {
        if (cnt++ > 0) {
            flag += ',';
        }
        flag += opt + ':' + options[opt];
    }
    flag += '^';
    return flag;
};

/**
 * Generates the path to uploaded media
 * @static
 * @method generateMediaPath
 * @param {String} originalFilename
 * @return {String}
 */
MediaService.generateMediaPath = function(originalFilename) {
    var now = new Date();
    var fn  = MediaService.generateFilename(originalFilename);
    return path.join('/media', now.getFullYear() + '', (now.getMonth() + 1) + '', fn);
};

/**
 * Generates a filename for a new media object
 * @static
 * @method generateFilename
 * @param {String} originalFilename
 * @return {String}
 */
MediaService.generateFilename = function(originalFilename){
	var now = new Date();

	//calculate extension
	var ext = '';
	var extIndex = originalFilename.lastIndexOf('.');
	if (extIndex >= 0){
		ext = originalFilename.substr(extIndex);
	}

	//build file name
    return pb.utils.uniqueId() + '-' + now.getTime() + ext;
};

/**
 * Retrieves the font awesome icon for the media type.
 * @static
 * @method getMediaIcon
 * @param {String} mediaType
 * @return {String}
 */
MediaService.getMediaIcon = function(mediaType) {
    switch(mediaType) {
        case 'image':
            return 'picture-o';
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
        case 'storify':
            return 'arrow-circle-right';
        default:
            return 'question';
    }
};

/**
 * Retrieves the content URL for a media type.
 * @static
 * @method getMediaLink
 * @param {String} mediaType
 * @param {String} mediaLocation
 * @param {Boolean} isFile
 * @return {String}
 */
MediaService.getMediaLink = function(mediaType, mediaLocation, isFile) {
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
        case 'storify':
            return 'http://storify.com/' + mediaLocation;
        case 'image':
        case 'video/mp4':
        case 'video/webm':
        case 'video/ogg':
        default:
            if(isFile) {
                return pb.config.siteRoot + mediaLocation;//TODO test this: pb.UrlService.urlJoin(pb.config.siteRoot, mediaLocation);
            }
            return mediaLocation;
    }
};

/**
 * Sets the proper icon and link for an array of media items
 * @static
 * @method formatMedia
 * @param {Array} media The array of media objects to format
 * @return {Array} The same array of media that was passed in
 */
MediaService.formatMedia = function(media) {
    for(var i = 0; i < media.length; i++) {
        media[i].icon = MediaService.getMediaIcon(media[i].media_type);
        media[i].link = MediaService.getMediaLink(media[i].media_type, media[i].location, media[i].is_file);
    }
    return media;
};

//exports
module.exports = MediaService;
