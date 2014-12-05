
//dependencies
var HtmlEncoder = require('htmlencode');

/**
 *
 * @class ImageMediaProvider
 * @constructor
 */
function ImageMediaProvider(){}

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

ImageMediaProvider.isSupported = function(urlStr) {
    var ext = pb.utils.getExtension(urlStr);
    return SUPPORTED[ext] ? true : false;
};

ImageMediaProvider.getType = function(urlStr) {
    return ImageMediaProvider.isSupported(urlStr) ? TYPE : null;
}

ImageMediaProvider.getIcon = function(type) {
    return 'picture-o';
};

ImageMediaProvider.renderByUrl = function(urlStr, props) {
    var mediaId = ImageMediaProvider.getMediaId(urlStr);
    return ImageMediaProvider.render({location: mediaId});
};

ImageMediaProvider.render = function(media, props) {
    var embedUrl = ImageMediaProvider.getEmbedUrl(media.location);
    var html = '<img src="' + HtmlEncoder.encode(embedUrl) + '"';
    for (var prop in props) {
        html += prop + '="' + HtmlEncoder.encode(props[prop]) + '" ';
    }
    html += '/>';
};

ImageMediaProvider.getEmbedUrl = function(mediaId) {
    return mediaId;
};

ImageMediaProvider.getMediaId = function(urlStr) {
    return urlStr;
};

ImageMediaProvider.getMeta = function(urlStr, cb) {
    var ext = pb.utils.getExtension(urlStr);
    var meta = pb.utils.clone(SUPPORTED[ext]);
    process.nextTick(function() {
        cb(null, meta);
    });
};

ImageMediaProvider.getThumbnail = function(urlStr, cb) {
    process.nextTick(function() {
        cb(null, urlStr);
    });
};

//exports
module.exports = ImageMediaProvider;
