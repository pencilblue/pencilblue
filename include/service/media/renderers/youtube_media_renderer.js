
//dependencies
var url = require('url');
var HtmlEncoder = require('htmlencode');
var BaseMediaRenderer = require('./base_media_renderer.js');

/**
 *
 * @class YouTubeMediaRenderer
 * @constructor
 */
function YouTubeMediaRenderer(){}

/**
 * The media type supported by the provider
 * @private
 * @static
 * @property TYPE
 * @type {String}
 */
var TYPE = 'youtube';

/**
 * Provides the styles used by each type of view
 * @private
 * @static
 * @property STYLES
 * @type {Object}
 */
var STYLES = Object.freeze({
    
    view: {
        'max-width': "100%"
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
YouTubeMediaRenderer.getStyle = function(viewType) {
    return STYLES[viewType] || STYLES.view;
};

YouTubeMediaRenderer.getSupportedTypes = function() {
    var types = {};
    types[TYPE] = true;
    return types;
};

YouTubeMediaRenderer.getName = function() {
    return 'YouTubeMediaRenderer';
};

YouTubeMediaRenderer.isSupported = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    return YouTubeMediaRenderer.isFullSite(details) || YouTubeMediaRenderer.isBelgiumDomain(details);
};

YouTubeMediaRenderer.isFullSite = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return parsedUrl.host.indexOf('youtube.com') >= 0 && parsedUrl.query.v;
};

YouTubeMediaRenderer.isBelgiumDomain = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return parsedUrl.host.indexOf('youtu.be') >= 0 && parsedUrl.pathname.indexOf('/') >= 0;
};

YouTubeMediaRenderer.getType = function(urlStr) {
    return YouTubeMediaRenderer.isSupported(urlStr) ? TYPE : null;
}

YouTubeMediaRenderer.getIcon = function(type) {
    return TYPE;
};

YouTubeMediaRenderer.renderByUrl = function(urlStr, options, cb) {
    YouTubeMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        YouTubeMediaRenderer.render({location: mediaId}, options, cb);
    });
};

YouTubeMediaRenderer.render = function(media, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb = options;
        options = {};
    }
    
    var embedUrl = YouTubeMediaRenderer.getEmbedUrl(media.location);
    cb(null, BaseMediaRenderer.renderIFrameEmbed(embedUrl, options.attrs, options.style));
};

YouTubeMediaRenderer.getEmbedUrl = function(mediaId) {
    return '//www.youtube.com/embed/' + mediaId;
};

YouTubeMediaRenderer.getMediaId = function(urlStr, cb) {
    var details = url.parse(urlStr, true, true);
    if (YouTubeMediaRenderer.isFullSite(details)) {
        return cb(null, details.query.v);
    }
    
    //we now know that it has to be the belgium domain
    cb(null, details.pathname.substr(details.pathname.lastIndexOf('/') + 1));
};

YouTubeMediaRenderer.getMeta = function(urlStr, isFile, cb) {
    var details = url.parse(urlStr, true, true);

    var meta = details.query;
    cb(null, meta);
};

YouTubeMediaRenderer.getThumbnail = function(urlStr, cb) {
    YouTubeMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        cb(err, 'http://img.youtube.com/vi/' + mediaId + '/0.jpg');
    });
};

YouTubeMediaRenderer.getNativeUrl = function(media) {
    return 'https://www.youtube.com/watch?v=' + media.location;
};

//exports
module.exports = YouTubeMediaRenderer;
