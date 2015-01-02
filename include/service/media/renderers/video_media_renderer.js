
//dependencies
var HtmlEncoder = require('htmlencode');

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
    webm: {
        mime: 'video/webm'
    }
});

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

VideoMediaRenderer.renderByUrl = function(urlStr, props, cb) {
    var mime    = SUPPORTED[pb.utils.getExtension(urlStr)];
    var mediaId = VideoMediaRenderer.getMediaId(urlStr);
    VideoMediaRenderer.render({location: mediaId, mime: mime}, props, cb);
};

VideoMediaRenderer.render = function(media, props, cb) {
    if (pb.utils.isFunction(props)) {
        cb = props;
        props = {};
    }
    
    var embedUrl = VideoMediaRenderer.getEmbedUrl(media.location);
    var html = '<video ';
    for (var prop in props) {
        html += prop + '="' + HtmlEncoder.htmlEncode(props[prop]) + '" ';
    }
    html += ' controls><source src="' + HtmlEncoder.htmlEncode(embedUrl) + '" type="' + media.mime + '" /></video>';
    
    cb(null, html);
};

VideoMediaRenderer.getEmbedUrl = function(mediaId) {
    return mediaId;
};

VideoMediaRenderer.getMediaId = function(urlStr) {
    return urlStr;
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

//exports
module.exports = VideoMediaRenderer;
