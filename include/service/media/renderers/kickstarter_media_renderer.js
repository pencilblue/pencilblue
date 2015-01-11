
//dependencies
var process = require('process');
var url = require('url');
var HtmlEncoder = require('htmlencode');
var BaseMediaRenderer = require('./base_media_renderer.js');

/**
 *
 * @class KickStarterMediaRenderer
 * @constructor
 */
function KickStarterMediaRenderer(){}

/**
 * The media type supported by the provider
 * @private
 * @static
 * @property TYPE
 * @type {String}
 */
var TYPE = 'kickstarter';

/**
 * Provides the styles used by each type of view
 * @private
 * @static
 * @property STYLES
 * @type {Object}
 */
var STYLES = Object.freeze({
    
    view: {
        frameborder: "0",
        width: "500",
        height: "281"
    },
    
    editor: {
        frameborder: "0",
        width: "500",
        height: "281"
    },
    
    post: {
        frameborder: "0",
        width: "500",
        height: "281"
    }
});

/**
 * Retrieves the style for the specified type of view
 * @static
 * @meethod getStyle
 * @param {String} viewType The view type calling for a styling
 * @return {Object} a hash of style properties
 */
KickStarterMediaRenderer.getStyle = function(viewType) {
    return STYLES[viewType] || STYLES.view;
};

KickStarterMediaRenderer.getSupportedTypes = function() {
    var types = {};
    types[TYPE] = true;
    return types;
};

KickStarterMediaRenderer.getName = function() {
    return 'KickStarterMediaRenderer';
};

KickStarterMediaRenderer.isSupported = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    return KickStarterMediaRenderer.isFullSite(details);
};

KickStarterMediaRenderer.isFullSite = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return parsedUrl.host.indexOf('kickstarter.com') >= 0 && parsedUrl.pathname.indexOf('/') >= 0;
};


KickStarterMediaRenderer.getType = function(urlStr) {
    return KickStarterMediaRenderer.isSupported(urlStr) ? TYPE : null;
}

KickStarterMediaRenderer.getIcon = function(type) {
    return 'dollar';
};

KickStarterMediaRenderer.renderByUrl = function(urlStr, props, cb) {
    KickStarterMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        KickStarterMediaRenderer.render({location: mediaId}, props, cb);
    });
};

KickStarterMediaRenderer.render = function(media, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb = options;
        options = {};
    }
    
    var embedUrl = KickStarterMediaRenderer.getEmbedUrl(media.location);
    cb(null, BaseMediaRenderer.renderIFrameEmbed(embedUrl, options.attrs, options.style));
};

KickStarterMediaRenderer.getEmbedUrl = function(mediaId) {
    return 'https://www.kickstarter.com/' + mediaId + '/widget/video.html';
};

KickStarterMediaRenderer.getMediaId = function(urlStr, cb) {
    var details = url.parse(urlStr, true, true);
    var mediaId = details.pathname;
    if (mediaId.indexOf('/') === 0) {
        mediaId = mediaId.substring(1);
    }
    if (mediaId.lastIndexOf('/') === mediaId.length - 1) {
        mediaId = mediaId.substring(0, mediaId.length - 2);
    }
    cb(null, mediaId);
};

KickStarterMediaRenderer.getMeta = function(urlStr, isFile, cb) {
    var details = url.parse(urlStr, true, true);

    var meta = details.query;
    process.nextTick(function() {
        cb(null, meta);
    });
};

KickStarterMediaRenderer.getThumbnail = function(urlStr, cb) {
    process.nextTick(function() {
        cb(null, '');
    });
};

KickStarterMediaRenderer.getNativeUrl = function(media) {
    return 'https://kickstarter.com/' + media.location;
};

//exports
module.exports = KickStarterMediaRenderer;
