
//dependencies
var process = require('process');
var url = require('url');
var https = require('https');
var HtmlEncoder = require('htmlencode');

/**
 *
 * @class SlideShareMediaRenderer
 * @constructor
 */
function SlideShareMediaRenderer(){}

/**
 * The media type supported by the provider
 * @private
 * @static
 * @property TYPE
 * @type {String}
 */
var TYPE = 'slideshare';


SlideShareMediaRenderer.getSupportedTypes = function() {
    var types = {};
    types[TYPE] = true;
    return types;
};

SlideShareMediaRenderer.getName = function() {
    return 'SlideShareMediaRenderer';
};

SlideShareMediaRenderer.isSupported = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    return SlideShareMediaRenderer.isFullSite(details);
};

SlideShareMediaRenderer.isFullSite = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return (parsedUrl.host.indexOf('slideshare.com') >= 0 || parsedUrl.host.indexOf('slideshare.net') >= 0) && parsedUrl.pathname.indexOf('/') >= 0;
};


SlideShareMediaRenderer.getType = function(urlStr) {
    return SlideShareMediaRenderer.isSupported(urlStr) ? TYPE : null;
}

SlideShareMediaRenderer.getIcon = function(type) {
    return 'list-alt';
};

SlideShareMediaRenderer.renderByUrl = function(urlStr, props, cb) {
    SlideShareMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        SlideShareMediaRenderer.render({location: mediaId}, props, cb);
    });
};

SlideShareMediaRenderer.render = function(media, props, cb) {
    if (pb.utils.isFunction(props)) {
        cb = props;
        props = {};
    }
    
    var embedUrl = SlideShareMediaRenderer.getEmbedUrl(media.location);
    var html = '<div class="embed-responsive embed-responsive-16by9"><iframe src="' + embedUrl + '" ';
    for (var prop in props) {
        html += prop + '="' + HtmlEncoder.htmlEncode(props[prop]) + '" ';
    }
    html += '/></div>';
    
    cb(null, html);
};

SlideShareMediaRenderer.getEmbedUrl = function(mediaId) {
    return '//www.slideshare.net/slideshow/embed_code/' + mediaId; 
};

SlideShareMediaRenderer.getMediaId = function(urlStr, cb) {
    SlideShareMediaRenderer.getDetails(urlStr, function(err, details) {console.log('***');console.log(details);
        if (util.isError(err)) {
            return cb(err);   
        }
        cb(null, details.slideshow_id);
    });
};

SlideShareMediaRenderer.getMeta = function(urlStr, isFile, cb) {
    var details = url.parse(urlStr, true, true);

    var meta = details.query;
    process.nextTick(function() {
        cb(null, meta);
    });
};

SlideShareMediaRenderer.getThumbnail = function(urlStr, cb) {
    SlideShareMediaRenderer.getDetails(urlStr, function(err, details) {
        if (util.isError(err)) {
            return cb(err);
        }
        cb(null, details.thumbnail);
    });
};

SlideShareMediaRenderer.getNativeUrl = function(media) {
    return 'http://slideshare.net/slideshow/embed_code/' + media.location;
};

SlideShareMediaRenderer.getDetails = function(urlStr, cb) {
    var options = {
        host: 'www.slideshare.net',
        path: '/api/oembed/2?url=' + encodeURIComponent(urlStr) + '&format=jsonp&callback=?'
    };
    var callback = function(response) {
        var str = '';

        //another chunk of data has been recieved, so append it to `str`
        response.once('error', cb);
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
            try {
                var data = JSON.parse(str);
                cb(null, data);
            }
            catch(err) {
                cb(err);
            }
        });
    };
    https.request(options, callback).end();
};

//exports
module.exports = SlideShareMediaRenderer;
