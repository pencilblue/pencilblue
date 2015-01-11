
//dependencies
var HtmlEncoder = require('htmlencode');
var BaseMediaRenderer = require('./base_media_renderer.js');

/**
 *
 * @class VideoMediaRenderer
 * @constructor
 */
function VideoMediaRenderer(){}

/**
 * The media type supported by the provider
 * @private
 * @static
 * @property TYPE
 * @type {String}
 */
var TYPE = 'video';

/**
 * The list of supported extensions
 * @private
 * @static
 * @readonly
 * @property SUPPORTED
 * @type {Object}
 */
var SUPPORTED = Object.freeze({
    mp4: {
        mime: 'video/mp4'
    },
    ogg: {
        mime: 'video/ogg'
    },
    ogv: {
        mime: 'video/ogg'
    },
    webm: {
        mime: 'video/webm'
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
        'max-height': "500px"
    },
    
    editor: {
        width: "560px",
        height: "315px"
    },
    
    post: {
        width: "560px",
        height: "315px"
    }
});

/**
 * Retrieves the style for the specified type of view
 * @static
 * @meethod getStyle
 * @param {String} viewType The view type calling for a styling
 * @return {Object} a hash of style properties
 */
VideoMediaRenderer.getStyle = function(viewType) {
    return STYLES[viewType] || STYLES.view;
};

VideoMediaRenderer.getSupportedTypes = function() {
    var types = {};
    types[TYPE] = true;
    return types;
};

VideoMediaRenderer.getName = function() {
    return 'ImageMediaProvider';
};

VideoMediaRenderer.isSupported = function(urlStr) {
    var ext = pb.utils.getExtension(urlStr);
    return SUPPORTED[ext] ? true : false;
};

VideoMediaRenderer.getType = function(urlStr) {
    return VideoMediaRenderer.isSupported(urlStr) ? TYPE : null;
}

VideoMediaRenderer.getIcon = function(type) {
    return 'film';
};

VideoMediaRenderer.renderByUrl = function(urlStr, options, cb) {
    VideoMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        VideoMediaRenderer.render({location: mediaId}, options, cb);
    });
};

VideoMediaRenderer.render = function(media, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb = options;
        options = {};
    }
    
    //try to look up mime if not provided
    var mime = media.mime;
    if (!mime) {
        
        var extension = SUPPORTED[pb.utils.getExtension(media.location)];
        if (extension) {
            mime = extension.mime;
        }
    }
    
    //construct HTML snippet
    var embedUrl = VideoMediaRenderer.getEmbedUrl(media.location);
    var html = '<video ' + BaseMediaRenderer.getAttributeStr(options.attrs) + 
        BaseMediaRenderer.getStyleAttrStr(options.style) +
        ' controls><source src="' + HtmlEncoder.htmlEncode(embedUrl) + '"';
    
    if (mime) {
        html += ' type="' + mime + '"';
    }
    html += '/></video>';
    
    cb(null, html);
};

VideoMediaRenderer.getEmbedUrl = function(mediaId) {
    return mediaId;
};

VideoMediaRenderer.getMediaId = function(urlStr, cb) {
    cb(null, urlStr);
};

VideoMediaRenderer.getMeta = function(urlStr, isFile, cb) {
    var ext = pb.utils.getExtension(urlStr);
    var meta = pb.utils.clone(SUPPORTED[ext]);
    process.nextTick(function() {
        cb(null, meta);
    });
};

VideoMediaRenderer.getThumbnail = function(urlStr, cb) {
    process.nextTick(function() {
        cb(null, '');
    });
};

VideoMediaRenderer.getNativeUrl = function(media) {
    return media.location;
};

//exports
module.exports = VideoMediaRenderer;
