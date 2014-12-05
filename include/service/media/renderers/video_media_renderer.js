
//dependencies
var HtmlEncoder = require('htmlencode');

/**
 *
 * @class VideoMediaProvider
 * @constructor
 */
function VideoMediaProvider(){}

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

VideoMediaProvider.isSupported = function(urlStr) {
    var ext = pb.utils.getExtension(urlStr);
    return SUPPORTED[ext] ? true : false;
};

VideoMediaProvider.getType = function(urlStr) {
    return VideoMediaProvider.isSupported(urlStr) ? TYPE : null;
}

VideoMediaProvider.getIcon = function(type) {
    return 'film';
};

VideoMediaProvider.renderByUrl = function(urlStr, props) {
    var mediaId = VideoMediaProvider.getMediaId(urlStr);
    return VideoMediaProvider.render({location: mediaId});
};

VideoMediaProvider.render = function(media, props) {
    var embedUrl = VideoMediaProvider.getEmbedUrl(media.location);
    var html = '<video ';
    for (var prop in props) {
        html += prop + '="' + HtmlEncoder.encode(props[prop]) + '" ';
    }
    html += ' controls><source src="' + HtmlEncoder.encode(embedUrl) + '" type="' + media.mime + '" /></video>';
};

VideoMediaProvider.getEmbedUrl = function(mediaId) {
    return mediaId;
};

VideoMediaProvider.getMediaId = function(urlStr) {
    return urlStr;
};

VideoMediaProvider.getMeta = function(urlStr, cb) {
    var ext = pb.utils.getExtension(urlStr);
    var meta = pb.utils.clone(SUPPORTED[ext]);
    process.nextTick(function() {
        cb(null, meta);
    });
};

VideoMediaProvider.getThumbnail = function(urlStr, cb) {
    process.nextTick(function() {
        cb(null, '');
    });
};

//exports
module.exports = VideoMediaProvider;
