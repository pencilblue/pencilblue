
//dependencies
var process = require('process');
var HtmlEncoder = require('htmlencode');

/**
 *
 * @class ImageMediaRenderer
 * @constructor
 */
function ImageMediaRenderer(){}

/**
 * The media type supported by the provider
 * @private
 * @static
 * @property TYPE
 * @type {String}
 */
var TYPE = 'image';

/**
 * The list of supported extensions
 * @private
 * @static
 * @readonly
 * @property SUPPORTED
 * @type {Object}
 */
var SUPPORTED = Object.freeze({
    jpg: {
        mime: 'image/jpg'
    },
    jpeg: {
        mime: 'image/jpeg'
    },
    png: {
        mime: 'image/png'
    },
    svg: {
        mime: 'image/svg+xml'
    },
    webp: {
        mime: 'image/webp'
    }
});

ImageMediaRenderer.getSupportedTypes = function() {
    var types = {};
    types[TYPE] = true;
    return types;
};

ImageMediaRenderer.getName = function() {
    return 'ImageMediaRenderer';
};

ImageMediaRenderer.isSupported = function(urlStr) {
    var ext = pb.utils.getExtension(urlStr);
    return SUPPORTED[ext] ? true : false;
};

ImageMediaRenderer.getType = function(urlStr) {
    return ImageMediaRenderer.isSupported(urlStr) ? TYPE : null;
}

ImageMediaRenderer.getIcon = function(type) {
    return 'picture-o';
};

ImageMediaRenderer.renderByUrl = function(urlStr, props, cb) {
    var mediaId = ImageMediaRenderer.getMediaId(urlStr);
    return ImageMediaRenderer.render({location: mediaId}, props, cb);
};

ImageMediaRenderer.render = function(media, props, cb) {
    if (pb.utils.isFunction(props)) {
        cb = props;
        props = {};
    }
    
    var embedUrl = ImageMediaRenderer.getEmbedUrl(media.location);
    var html = '<img src="' + HtmlEncoder.htmlEncode(embedUrl) + '"';
    for (var prop in props) {
        html += prop + '="' + HtmlEncoder.htmlEncode(props[prop]) + '" ';
    }
    html += '/>';
    
    cb(null, html);
};

ImageMediaRenderer.getEmbedUrl = function(mediaId) {
    return mediaId;
};

ImageMediaRenderer.getMediaId = function(urlStr) {
    return urlStr;
};

ImageMediaRenderer.getMeta = function(urlStr, isFile, cb) {
    var ext = pb.utils.getExtension(urlStr);
    var meta = pb.utils.clone(SUPPORTED[ext]);
    process.nextTick(function() {
        cb(null, meta);
    });
};

ImageMediaRenderer.getThumbnail = function(urlStr, cb) {
    process.nextTick(function() {
        cb(null, urlStr);
    });
};

ImageMediaRenderer.getNativeUrl = function(media) {
    return media.location;
};

//exports
module.exports = ImageMediaRenderer;
