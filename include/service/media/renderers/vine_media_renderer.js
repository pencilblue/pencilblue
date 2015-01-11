
//dependencies
var process = require('process');
var url = require('url');
var BaseMediaRenderer = require('./base_media_renderer.js');

/**
 *
 * @class VineMediaRenderer
 * @constructor
 */
function VineMediaRenderer(){}

/**
 * The media type supported by the provider
 * @private
 * @static
 * @property TYPE
 * @type {String}
 */
var TYPE = 'vine';

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
        'max-height': "400px"
    },
    
    editor: {
        width: "400px",
        height: "400px"
    },
    
    post: {
        width: "400px",
        height: "400px"
    }
});

/**
 * Retrieves the style for the specified type of view
 * @static
 * @meethod getStyle
 * @param {String} viewType The view type calling for a styling
 * @return {Object} a hash of style properties
 */
VineMediaRenderer.getStyle = function(viewType) {
    return STYLES[viewType] || STYLES.view;
};

VineMediaRenderer.getSupportedTypes = function() {
    var types = {};
    types[TYPE] = true;
    return types;
};

VineMediaRenderer.getName = function() {
    return 'VineMediaRenderer';
};

VineMediaRenderer.isSupported = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    return VineMediaRenderer.isFullSite(details);
};

VineMediaRenderer.isFullSite = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return parsedUrl.host.indexOf('vine.co') >= 0 && parsedUrl.pathname.indexOf('/v/') >= 0;
};


VineMediaRenderer.getType = function(urlStr) {
    return VineMediaRenderer.isSupported(urlStr) ? TYPE : null;
}

VineMediaRenderer.getIcon = function(type) {
    return 'vine';
};

VineMediaRenderer.renderByUrl = function(urlStr, options, cb) {
    VineMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        VineMediaRenderer.render({location: mediaId}, options, cb);
    });
};

VineMediaRenderer.render = function(media, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb = options;
        options = {};
    }
    
    var embedUrl = VineMediaRenderer.getEmbedUrl(media.location);
    cb(null, BaseMediaRenderer.renderIFrameEmbed(embedUrl, options.attrs, options.style));
};

VineMediaRenderer.getEmbedUrl = function(mediaId) {
    return 'https://vine.co/v/' + mediaId + '/embed/simple';
};

VineMediaRenderer.getMediaId = function(urlStr, cb) {
    var details = url.parse(urlStr, true, true);
    var parts = details.pathname.split('/');
    cb(null, parts[2]);
};

VineMediaRenderer.getMeta = function(urlStr, isFile, cb) {
    var details = url.parse(urlStr, true, true);

    var meta = details.query;
    process.nextTick(function() {
        cb(null, meta);
    });
};

VineMediaRenderer.getThumbnail = function(urlStr, cb) {
    process.nextTick(function() {
        cb(null, '');
    });
};

VineMediaRenderer.getNativeUrl = function(media) {
    return 'https://vine.co/v/' + media.location;
};

//exports
module.exports = VineMediaRenderer;
