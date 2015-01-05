
//dependencies
var process = require('process');
var url = require('url');
var HtmlEncoder = require('htmlencode');

/**
 *
 * @class YouTubeMediaRenderer
 * @constructor
 */
function YouTubeMediaRenderer(){}

/**
 * The media type supported by the provider
 * @private
 * @static
 * @property TYPE
 * @type {String}
 */
var TYPE = 'youtube';


YouTubeMediaRenderer.getSupportedTypes = function() {
    var types = {};
    types[TYPE] = true;
    return types;
};

YouTubeMediaRenderer.getName = function() {
    return 'YouTubeMediaRenderer';
};

YouTubeMediaRenderer.isSupported = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    return YouTubeMediaRenderer.isFullSite(details) || YouTubeMediaRenderer.isBelgiumDomain(details);
};

YouTubeMediaRenderer.isFullSite = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return parsedUrl.host.indexOf('youtube.com') >= 0 && parsedUrl.query.v;
};

YouTubeMediaRenderer.isBelgiumDomain = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return parsedUrl.host.indexOf('youtu.be') >= 0 && parsedUrl.pathname.indexOf('/') >= 0;
};

YouTubeMediaRenderer.getType = function(urlStr) {
    return YouTubeMediaRenderer.isSupported(urlStr) ? TYPE : null;
}

YouTubeMediaRenderer.getIcon = function(type) {
    return TYPE;
};

YouTubeMediaRenderer.renderByUrl = function(urlStr, props, cb) {
    YouTubeMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        YouTubeMediaRenderer.render({location: mediaId}, props, cb);
    });
};

YouTubeMediaRenderer.render = function(media, props, cb) {
    if (pb.utils.isFunction(props)) {
        cb = props;
        props = {};
    }
    
    var embedUrl = YouTubeMediaRenderer.getEmbedUrl(media.location);
    var html = '<div class="embed-responsive embed-responsive-16by9"><iframe src="' + embedUrl + '" ';
    for (var prop in props) {
        html += prop + '="' + HtmlEncoder.htmlEncode(props[prop]) + '" ';
    }
    html += '/></div>';
    
    cb(null, html);
};

YouTubeMediaRenderer.getEmbedUrl = function(mediaId) {
    return '//www.youtube.com/embed/' + mediaId;
};

YouTubeMediaRenderer.getMediaId = function(urlStr, cb) {
    var details = url.parse(urlStr, true, true);
    if (YouTubeMediaRenderer.isFullSite(details)) {
        return cb(null, details.query.v);
    }
    
    //we now know that it has to be the belgium domain
    cb(null, details.pathname.substr(details.pathname.lastIndexOf('/') + 1));
};

YouTubeMediaRenderer.getMeta = function(urlStr, isFile, cb) {
    var details = url.parse(urlStr, true, true);

    var meta = details.query;
    process.nextTick(function() {
        cb(null, meta);
    });
};

YouTubeMediaRenderer.getThumbnail = function(urlStr, cb) {
    var mediaId = YouTubeMediaRenderer.getMediaId(urlStr);
    process.nextTick(function() {
        cb(null, 'http://img.youtube.com/vi/' + mediaId + '/0.jpg');
    });
};

YouTubeMediaRenderer.getNativeUrl = function(media) {
    return 'https://www.youtube.com/watch?v=' + media.location;
};

//exports
module.exports = YouTubeMediaRenderer;
