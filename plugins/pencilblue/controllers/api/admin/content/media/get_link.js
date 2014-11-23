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
 * Returns information on a media link
 */
function GetMediaLink(){}

//inheritance
util.inherits(GetMediaLink, pb.BaseController);

GetMediaLink.prototype.render = function(cb) {
    var self = this;
    var get  = this.query;

    if (!pb.validation.isUrl(get.url, true)) {
        return cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_URL'))
        });
        return;
    }

    if(self.checkForMediaFile(get.url, cb)) {
        return;
    }

    get.url = get.url.split('https://').join('').split('http://').join('').split('//').join('');
    if(get.url.charAt(get.url.length - 1) === '/') {
        get.url = get.url.substr(0, get.url.length - 1);
    }

    if(get.url.indexOf('youtube.com') !== -1 || get.url.indexOf('youtu.be') !== -1) {
        self.getYouTube(get.url, cb, get.url.indexOf('youtu.be') > -1 );
    }
    else if(get.url.indexOf('vimeo.com') !== -1) {
        self.getVimeo(get.url, cb);
    }
    else if(get.url.indexOf('dailymotion.com/video/') !== -1 || get.url.indexOf('dai.ly') !== -1) {
        self.getDailyMotion(get.url, cb);
    }
    else if(get.url.indexOf('vine.co') !== -1) {
        self.getVine(get.url, cb);
    }
    else if(get.url.indexOf('instagram.com') !== -1) {
        self.getInstagram(get.url, cb);
    }
    else if(get.url.indexOf('slideshare.net') !== -1) {
        self.getSlideshare(get.url, cb);
    }
    else if(get.url.indexOf('trinket.io') !== -1) {
        self.getTrinket(get.url, cb);
    }
    else if(get.url.indexOf('storify.com') !== -1) {
        self.getStorify(get.url, cb);
    }
    else if(get.url.indexOf('kickstarter.com') !== -1) {
        self.getKickstarter(get.url, cb);
    }
    else {
        cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('UNSUPPORTED_MEDIA'))
        });
    }
};

GetMediaLink.prototype.checkForMediaFile = function(url, cb) {
    var self = this;
    var fileType = url.substr(url.lastIndexOf('.') + 1).toLowerCase();

    switch(fileType) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'svg':
        case 'webp':
            self.mediaOutput('image', url, url, cb);
            return true;
        case 'mp4':
            self.mediaOutput('video/mp4', url, '', cb);
            return true;
        case 'webm':
            self.mediaOutput('video/webm', url, '', cb);
            return true;
        case 'ogv':
            self.mediaOutput('video/ogg', url, '', cb);
            return true;
    }
    return false;
};

GetMediaLink.prototype.getYouTube = function(url, cb, shortURL) {
    var videoId;

    if(!shortURL) {
        if(url.indexOf('v=') === -1) {
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_MEDIA_URL'))
            });
            return;
        }
        videoId = url.substr(url.indexOf('v=') + 2);
        if(videoId.indexOf('&') != -1) {
            videoId = videoId.substr(0, videoId.indexOf('&'));
        }
    }
    else {
        if(url.indexOf('/') === -1) {
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_MEDIA_URL'))
            });
            return;
        }
        videoId = url.substr(url.lastIndexOf('/') + 1);
        if(videoId.indexOf('?') != -1) {
            videoId = videoId.substr(0, videoId.indexOf('?'));
        }
    }

    this.mediaOutput('youtube', videoId, 'http://img.youtube.com/vi/' + videoId + '/0.jpg', cb);
};

GetMediaLink.prototype.getVimeo = function(url, cb) {
    var self = this;

    if(url.indexOf('/') === -1) {
        cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_MEDIA_URL'))
        });
        return;
    }

    var videoId = url.substr(url.lastIndexOf('/') + 1);
    if(videoId.indexOf('?') != -1)
    {
        videoId = videoId.substr(0, videoId.indexOf('?'));
    }

    this.getJSON('http://vimeo.com/api/v2/video/' + videoId + '.json', function(data) {
        self.mediaOutput('vimeo', videoId, data[0].thumbnail_medium, cb);
    });
};

GetMediaLink.prototype.getDailyMotion = function(url, cb) {
    if(url.indexOf('/') === -1) {
        cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_MEDIA_URL'))
        });
        return;
    }

    var videoId = url.substr(url.lastIndexOf('/') + 1);
    if(videoId.indexOf('?') != -1)
    {
        videoId = videoId.substr(0, videoId.indexOf('?'));
    }
    this.mediaOutput('daily_motion', videoId, 'http://www.dailymotion.com/thumbnail/video/' + videoId, cb);
};

GetMediaLink.prototype.getVine = function(url, cb) {
    url = url.split('/embed').join('');

    if(url.indexOf('/') === -1) {
        cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_MEDIA_URL'))
        });
        return;
    }

    var videoId = url.substr(url.lastIndexOf('/') + 1);
    if(videoId.indexOf('?') != -1)
    {
        videoId = videoId.substr(0, videoId.indexOf('?'));
    }

    this.mediaOutput('vine', videoId, '', cb);
};

GetMediaLink.prototype.getInstagram = function(url, cb) {
    if(url.indexOf('/') === -1) {
        cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_MEDIA_URL'))
        });
        return;
    }

    var videoId = url.substr(url.lastIndexOf('/') + 1);
    if(videoId.indexOf('?') != -1)
    {
        videoId = videoId.substr(0, videoId.indexOf('?'));
    }

    this.mediaOutput('instagram', videoId, '', cb);
};

GetMediaLink.prototype.getSlideshare = function(url, cb) {
    var self = this;

    if(url.indexOf('/') === -1) {
        cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_MEDIA_URL'))
        });
        return;
    }

    this.getJSON('http://www.slideshare.net/api/oembed/2?url=' + url + '&format=jsonp&callback=?', function(data) {
        var slideshowId = data.slideshow_id;
        if(!slideshowId)
        {
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_MEDIA_URL'))
            });
            return;
        }

        self.mediaOutput('slideshare', slideshowId, '', cb);
    });
};

GetMediaLink.prototype.getTrinket = function(url, cb) {
    if(url.indexOf('/embed') === -1) {
        cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_MEDIA_URL'))
        });
        return;
    }

    var mediaId = url.substr(url.lastIndexOf('/embed') + 7);
    this.mediaOutput('trinket', mediaId, '', cb);
};

GetMediaLink.prototype.getStorify = function(url, cb) {
    if(url.indexOf('/') === -1) {
        cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_MEDIA_URL'))
        });
        return;
    }

    var mediaId = url.substr(url.indexOf('storify.com') + 12);
    this.mediaOutput('storify', mediaId, '', cb);
};

GetMediaLink.prototype.getKickstarter = function(url, cb) {
    if(url.indexOf('/') === -1) {
        cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_MEDIA_URL'))
        });
        return;
    }

    var videoId = url.substr(url.indexOf('kickstarter.com') + 15);
    if(videoId.indexOf('?') != -1)
    {
        videoId = videoId.substr(0, videoId.indexOf('?'));
    }

    this.mediaOutput('kickstarter', videoId, '', cb);
};

GetMediaLink.prototype.getJSON = function(url, cb) {
    http.get(url, function(res) {
        var body = '';

        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function() {
            cb(JSON.parse(body));
        });
    });
};

GetMediaLink.prototype.mediaOutput = function(type, location, thumb, cb) {
    var mediaData = {
        isFile: type === 'image' || type.indexOf('video/') > -1,
        mediaType: type,
        location: location,
        thumb: thumb
    };

    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, '', mediaData)});
};

//exports
module.exports = GetMediaLink;
