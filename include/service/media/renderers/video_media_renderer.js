
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
    ogv: {
        mime: 'video/ogg'
    },
    webm: {
        mime: 'video/webm'
    }
});

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

VideoMediaRenderer.renderByUrl = function(urlStr, props, cb) {
    VideoMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        VideoMediaRenderer.render({location: mediaId}, props, cb);
    });
};

VideoMediaRenderer.render = function(media, props, cb) {
    if (pb.utils.isFunction(props)) {
        cb = props;
        props = {};
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
    var html = '<video ';
    for (var prop in props) {
        html += prop + '="' + HtmlEncoder.htmlEncode(props[prop]) + '" ';
    }
    html += ' controls><source src="' + HtmlEncoder.htmlEncode(embedUrl) + '"';
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
