
//dependencies
var process = require('process');
var url = require('url');
var HtmlEncoder = require('htmlencode');
var BaseMediaRenderer = require('./base_media_renderer.js');

/**
 *
 * @class InstagramMediaRenderer
 * @constructor
 */
function InstagramMediaRenderer(){}

/**
 * The media type supported by the provider
 * @private
 * @static
 * @property TYPE
 * @type {String}
 */
var TYPE = 'instagram';

/**
 * Provides the styles used by each type of view
 * @private
 * @static
 * @property STYLES
 * @type {Object}
 */
var STYLES = Object.freeze({
    
    view: {
        width: "100%"
    },
    
    editor: {
        width: "400px",
        height: "475px"
    },
    
    post: {
        width: "400px",
        height: "475px"
    }
});

/**
 * Retrieves the style for the specified type of view
 * @static
 * @meethod getStyle
 * @param {String} viewType The view type calling for a styling
 * @return {Object} a hash of style properties
 */
InstagramMediaRenderer.getStyle = function(viewType) {
    return STYLES[viewType] || STYLES.view;
};

InstagramMediaRenderer.getSupportedTypes = function() {
    var types = {};
    types[TYPE] = true;
    return types;
};

InstagramMediaRenderer.getName = function() {
    return 'InstagramMediaRenderer';
};

InstagramMediaRenderer.isSupported = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    return InstagramMediaRenderer.isFullSite(details);
};

InstagramMediaRenderer.isFullSite = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return parsedUrl.host.indexOf('instagram.com') >= 0 && parsedUrl.pathname.indexOf('/p/') === 0;
};


InstagramMediaRenderer.getType = function(urlStr) {
    return InstagramMediaRenderer.isSupported(urlStr) ? TYPE : null;
}

InstagramMediaRenderer.getIcon = function(type) {
    return TYPE;
};

InstagramMediaRenderer.renderByUrl = function(urlStr, options, cb) {
    InstagramMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        InstagramMediaRenderer.render({location: mediaId}, options, cb);
    });
};

InstagramMediaRenderer.render = function(media, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb = options;
        options = {};
    }
    
    var embedUrl = InstagramMediaRenderer.getEmbedUrl(media.location);
    cb(null, BaseMediaRenderer.renderIFrameEmbed(embedUrl, options.attrs, options.style));
};

InstagramMediaRenderer.getEmbedUrl = function(mediaId) {
    return '//instagram.com/p/' + mediaId + '/embed/';
};

InstagramMediaRenderer.getMediaId = function(urlStr, cb) {
    var details = url.parse(urlStr, true, true);
    var parts = details.pathname.split('/');
    cb(null, parts[2]);
};

InstagramMediaRenderer.getMeta = function(urlStr, isFile, cb) {
    var details = url.parse(urlStr, true, true);

    var meta = details.query;
    process.nextTick(function() {
        cb(null, meta);
    });
};

InstagramMediaRenderer.getThumbnail = function(urlStr, cb) {
    process.nextTick(function() {
        cb(null, '');
    });
};

InstagramMediaRenderer.getNativeUrl = function(media) {
    return 'http://instagram.com/p/' + media.location;
};

//exports
module.exports = InstagramMediaRenderer;
