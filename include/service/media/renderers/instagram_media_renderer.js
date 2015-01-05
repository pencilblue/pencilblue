
//dependencies
var process = require('process');
var url = require('url');
var HtmlEncoder = require('htmlencode');

/**
 *
 * @class InstagramMediaRenderer
 * @constructor
 */
function InstagramMediaRenderer(){}

/**
 * The media type supported by the provider
 * @private
 * @static
 * @property TYPE
 * @type {String}
 */
var TYPE = 'instagram';


InstagramMediaRenderer.getSupportedTypes = function() {
    var types = {};
    types[TYPE] = true;
    return types;
};

InstagramMediaRenderer.getName = function() {
    return 'InstagramMediaRenderer';
};

InstagramMediaRenderer.isSupported = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    return InstagramMediaRenderer.isFullSite(details);
};

InstagramMediaRenderer.isFullSite = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return parsedUrl.host.indexOf('instagram.com') >= 0 && parsedUrl.pathname.indexOf('/p/') === 0;
};


InstagramMediaRenderer.getType = function(urlStr) {
    return InstagramMediaRenderer.isSupported(urlStr) ? TYPE : null;
}

InstagramMediaRenderer.getIcon = function(type) {
    return TYPE;
};

InstagramMediaRenderer.renderByUrl = function(urlStr, props, cb) {
    var mediaId = InstagramMediaRenderer.getMediaId(urlStr);
    return InstagramMediaRenderer.render({location: mediaId}, props, cb);
};

InstagramMediaRenderer.render = function(media, props, cb) {
    if (pb.utils.isFunction(props)) {
        cb = props;
        props = {};
    }
    
    var embedUrl = InstagramMediaRenderer.getEmbedUrl(media.location);
    var html = '<div class="embed-responsive embed-responsive-16by9"><iframe src="' + embedUrl + '" ';
    for (var prop in props) {
        html += prop + '="' + HtmlEncoder.htmlEncode(props[prop]) + '" ';
    }
    html += '/></div>';
    
    cb(null, html);
};

InstagramMediaRenderer.getEmbedUrl = function(mediaId) {
    return '//instagram.com/p/' + mediaId + '/embed/';
};

InstagramMediaRenderer.getMediaId = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    var parts = details.pathname.split('/');
    return parts[2];
};

InstagramMediaRenderer.getMeta = function(urlStr, isFile, cb) {
    var details = url.parse(urlStr, true, true);

    var meta = details.query;
    process.nextTick(function() {
        cb(null, meta);
    });
};

InstagramMediaRenderer.getThumbnail = function(urlStr, cb) {
    process.nextTick(function() {
        cb(null, '');
    });
};

InstagramMediaRenderer.getNativeUrl = function(media) {
    return 'http://instagram.com/p/' + media.location;
};

//exports
module.exports = InstagramMediaRenderer;
