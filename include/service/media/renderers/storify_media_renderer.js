
//dependencies
var process = require('process');
var url = require('url');
var HtmlEncoder = require('htmlencode');

/**
 *
 * @class StorifyMediaRenderer
 * @constructor
 */
function StorifyMediaRenderer(){}

/**
 * The media type supported by the provider
 * @private
 * @static
 * @property TYPE
 * @type {String}
 */
var TYPE = 'storify';


StorifyMediaRenderer.getSupportedTypes = function() {
    var types = {};
    types[TYPE] = true;
    return types;
};

StorifyMediaRenderer.getName = function() {
    return 'StorifyMediaRenderer';
};

StorifyMediaRenderer.isSupported = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    return StorifyMediaRenderer.isFullSite(details);
};

StorifyMediaRenderer.isFullSite = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return parsedUrl.host.indexOf('storify.com') >= 0 && parsedUrl.pathname.indexOf('/') >= 0;
};


StorifyMediaRenderer.getType = function(urlStr) {
    return StorifyMediaRenderer.isSupported(urlStr) ? TYPE : null;
}

StorifyMediaRenderer.getIcon = function(type) {
    return 'arrow-circle-right';
};

StorifyMediaRenderer.renderByUrl = function(urlStr, props, cb) {
    StorifyMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        StorifyMediaRenderer.render({location: mediaId}, props, cb);
    });
};

StorifyMediaRenderer.render = function(media, props, cb) {
    if (pb.utils.isFunction(props)) {
        cb = props;
        props = {};
    }
    
    var embedUrl = StorifyMediaRenderer.getEmbedUrl(media.location);
    var html = '<iframe src="' + embedUrl + '" ';
    for (var prop in props) {
        html += prop + '="' + HtmlEncoder.htmlEncode(props[prop]) + '" ';
    }
    html += '></iframe>';
    
    cb(null, html);
};

StorifyMediaRenderer.getEmbedUrl = function(mediaId) {
    return '//storify.com/' + mediaId + '/embed?header=false&border=false';
};

StorifyMediaRenderer.getMediaId = function(urlStr, cb) {
    var details = url.parse(urlStr, true, true);
    var mediaId = details.pathname;
    if (mediaId.indexOf('/') === 0) {
        mediaId = mediaId.substring(1);
    }
    cb(null, mediaId);
};

StorifyMediaRenderer.getMeta = function(urlStr, isFile, cb) {
    var details = url.parse(urlStr, true, true);

    var meta = details.query;
    process.nextTick(function() {
        cb(null, meta);
    });
};

StorifyMediaRenderer.getThumbnail = function(urlStr, cb) {
    process.nextTick(function() {
        cb(null, '');
    });
};

StorifyMediaRenderer.getNativeUrl = function(media) {
    return 'https://storify.com/' + media.location;
};

//exports
module.exports = StorifyMediaRenderer;
