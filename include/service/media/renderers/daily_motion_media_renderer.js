
//dependencies
var process = require('process');
var url = require('url');
var HtmlEncoder = require('htmlencode');

/**
 *
 * @class DailyMotionMediaRenderer
 * @constructor
 */
function DailyMotionMediaRenderer(){}

/**
 * The media type supported by the provider
 * @private
 * @static
 * @property TYPE
 * @type {String}
 */
var TYPE = 'daily_motion';


DailyMotionMediaRenderer.getSupportedTypes = function() {
    var types = {};
    types[TYPE] = true;
    return types;
};

DailyMotionMediaRenderer.getName = function() {
    return 'DailyMotionMediaRenderer';
};

DailyMotionMediaRenderer.isSupported = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    return DailyMotionMediaRenderer.isFullSite(details) || DailyMotionMediaRenderer.isLibyanDomain(details);
};

DailyMotionMediaRenderer.isFullSite = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return parsedUrl.host.indexOf('dailymotion.com') >= 0 && parsedUrl.pathname.indexOf('/video/') === 0;
};

DailyMotionMediaRenderer.isLibyanDomain = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return parsedUrl.host.indexOf('dai.ly') >= 0 && parsedUrl.pathname.indexOf('/') >= 0;
};

DailyMotionMediaRenderer.getType = function(urlStr) {
    return DailyMotionMediaRenderer.isSupported(urlStr) ? TYPE : null;
}

DailyMotionMediaRenderer.getIcon = function(type) {
    return 'play-circle-o';
};

DailyMotionMediaRenderer.renderByUrl = function(urlStr, props, cb) {
    var mediaId = DailyMotionMediaRenderer.getMediaId(urlStr);
    return DailyMotionMediaRenderer.render({location: mediaId}, props, cb);
};

DailyMotionMediaRenderer.render = function(media, props, cb) {
    if (pb.utils.isFunction(props)) {
        cb = props;
        props = {};
    }
    
    var embedUrl = DailyMotionMediaRenderer.getEmbedUrl(media.location);
    var html = '<div class="embed-responsive embed-responsive-16by9"><iframe src="' + embedUrl + '" ';
    for (var prop in props) {
        html += prop + '="' + HtmlEncoder.htmlEncode(props[prop]) + '" ';
    }
    html += '/></div>';
    
    cb(null, html);
};

DailyMotionMediaRenderer.getEmbedUrl = function(mediaId) {
    return '//www.dailymotion.com/embed/video/' + mediaId;
};

DailyMotionMediaRenderer.getMediaId = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    return details.pathname.substr(details.pathname.lastIndexOf('/') + 1);
};

DailyMotionMediaRenderer.getMeta = function(urlStr, isFile, cb) {
    var details = url.parse(urlStr, true, true);

    var meta = details.query;
    process.nextTick(function() {
        cb(null, meta);
    });
};

DailyMotionMediaRenderer.getThumbnail = function(urlStr, cb) {
    var mediaId = DailyMotionMediaRenderer.getMediaId(urlStr);
    process.nextTick(function() {
        cb(null, 'https://www.dailymotion.com/thumbnail/video/' + mediaId);
    });
};

DailyMotionMediaRenderer.getNativeUrl = function(media) {
    return 'http://dailymotion.com/video/' + media.location;
};

//exports
module.exports = DailyMotionMediaRenderer;
