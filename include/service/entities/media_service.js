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
function MediaService(){}

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

//exports
module.exports = MediaService;
