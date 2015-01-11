
//dependencies
var process = require('process');
var HtmlEncoder = require('htmlencode');
var BaseMediaRenderer = require('./base_media_renderer.js');

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

/**
 * Provides the styles used by each type of view
 * @private
 * @static
 * @property STYLES
 * @type {Object}
 */
var STYLES = Object.freeze({
    
    view: {
        'max-width': "100%",
        'max-height': '500px'
    },
    
    editor: {
        width: "300px"
    },
    
    post: {
        width: "300px"
    }
});

/**
 * Retrieves the style for the specified type of view
 * @static
 * @meethod getStyle
 * @param {String} viewType The view type calling for a styling
 * @return {Object} a hash of style properties
 */
ImageMediaRenderer.getStyle = function(viewType) {
    return STYLES[viewType] || STYLES.view;
};

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

ImageMediaRenderer.renderByUrl = function(urlStr, options, cb) {
    ImageMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        ImageMediaRenderer.render({location: mediaId}, options, cb);
    });
};

ImageMediaRenderer.render = function(media, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb = options;
        options = {};
    }
    
    var embedUrl = ImageMediaRenderer.getEmbedUrl(media.location);
    cb(null, BaseMediaRenderer.renderSingleElementEmbed('image', embedUrl, options.attrs, options.style));
};

ImageMediaRenderer.getEmbedUrl = function(mediaId) {
    return mediaId;
};

ImageMediaRenderer.getMediaId = function(urlStr, cb) {
    cb(null, urlStr);
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
