
//dependencies
var process = require('process');
var url = require('url');
var HtmlEncoder = require('htmlencode');

/**
 *
 * @class VineMediaRenderer
 * @constructor
 */
function VineMediaRenderer(){}

/**
 * The media type supported by the provider
 * @private
 * @static
 * @property TYPE
 * @type {String}
 */
var TYPE = 'vine';


VineMediaRenderer.getSupportedTypes = function() {
    var types = {};
    types[TYPE] = true;
    return types;
};

VineMediaRenderer.getName = function() {
    return 'VineMediaRenderer';
};

VineMediaRenderer.isSupported = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    return VineMediaRenderer.isFullSite(details);
};

VineMediaRenderer.isFullSite = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return parsedUrl.host.indexOf('vine.co') >= 0 && parsedUrl.pathname.indexOf('/v/') >= 0;
};


VineMediaRenderer.getType = function(urlStr) {
    return VineMediaRenderer.isSupported(urlStr) ? TYPE : null;
}

VineMediaRenderer.getIcon = function(type) {
    return 'vine';
};

VineMediaRenderer.renderByUrl = function(urlStr, props, cb) {
    var mediaId = VineMediaRenderer.getMediaId(urlStr);
    return VineMediaRenderer.render({location: mediaId}, props, cb);
};

VineMediaRenderer.render = function(media, props, cb) {
    if (pb.utils.isFunction(props)) {
        cb = props;
        props = {};
    }
    
    var embedUrl = VineMediaRenderer.getEmbedUrl(media.location);
    var html = '<div class="embed-responsive embed-responsive-16by9"><iframe src="' + embedUrl + '" ';
    for (var prop in props) {
        html += prop + '="' + HtmlEncoder.htmlEncode(props[prop]) + '" ';
    }
    html += '/></div>';
    
    cb(null, html);
};

VineMediaRenderer.getEmbedUrl = function(mediaId) {
    return 'https://vine.co/v/' + mediaId + '/embed/simple';
};

VineMediaRenderer.getMediaId = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    var parts = details.pathname.split('/');
    return parts[2];
};

VineMediaRenderer.getMeta = function(urlStr, isFile, cb) {
    var details = url.parse(urlStr, true, true);

    var meta = details.query;
    process.nextTick(function() {
        cb(null, meta);
    });
};

VineMediaRenderer.getThumbnail = function(urlStr, cb) {
    process.nextTick(function() {
        cb(null, '');
    });
};

VineMediaRenderer.getNativeUrl = function(media) {
    return 'https://vine.co/v/' + media.location;
};

//exports
module.exports = VineMediaRenderer;
