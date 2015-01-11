
//dependencies
var process = require('process');
var url = require('url');
var BaseMediaRenderer = require('./base_media_renderer.js');

/**
 *
 * @class TrinketMediaRenderer
 * @constructor
 */
function TrinketMediaRenderer(){}

/**
 * The media type supported by the provider
 * @private
 * @static
 * @property TYPE
 * @type {String}
 */
var TYPE = 'trinket';

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
        width: "600px",
        height: "400px"
    },
    
    post: {
        width: "600px",
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
TrinketMediaRenderer.getStyle = function(viewType) {
    return STYLES[viewType] || STYLES.view;
};

TrinketMediaRenderer.getSupportedTypes = function() {
    var types = {};
    types[TYPE] = true;
    return types;
};

TrinketMediaRenderer.getName = function() {
    return 'TrinketMediaRenderer';
};

TrinketMediaRenderer.isSupported = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    return TrinketMediaRenderer.isFullSite(details);
};

TrinketMediaRenderer.isFullSite = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return parsedUrl.host.indexOf('trinket.io') >= 0 && (parsedUrl.pathname.indexOf('/python/') === 0 || parsedUrl.pathname.indexOf('/embed/') === 0);
};


TrinketMediaRenderer.getType = function(urlStr) {
    return TrinketMediaRenderer.isSupported(urlStr) ? TYPE : null;
}

TrinketMediaRenderer.getIcon = function(type) {
    return 'key fa-flip-horizontal';
};

TrinketMediaRenderer.renderByUrl = function(urlStr, options, cb) {
    TrinketMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        TrinketMediaRenderer.render({location: mediaId}, options, cb);
    });
};

TrinketMediaRenderer.render = function(media, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb = options;
        options = {};
    }
    
    var embedUrl = TrinketMediaRenderer.getEmbedUrl(media.location);
    cb(null, BaseMediaRenderer.renderIFrameEmbed(embedUrl, options.attrs, options.style));
};

TrinketMediaRenderer.getEmbedUrl = function(mediaId) {
    return 'https://trinket.io/embed/python/' + mediaId;
};

TrinketMediaRenderer.getMediaId = function(urlStr, cb) {
    var details = url.parse(urlStr, true, true);
    var parts = details.pathname.split('/');
    cb(null, parts[2]);
};

TrinketMediaRenderer.getMeta = function(urlStr, isFile, cb) {
    var details = url.parse(urlStr, true, true);

    var meta = details.query;
    process.nextTick(function() {
        cb(null, meta);
    });
};

TrinketMediaRenderer.getThumbnail = function(urlStr, cb) {
    process.nextTick(function() {
        cb(null, '');
    });
};

TrinketMediaRenderer.getNativeUrl = function(media) {
    return 'http://trinket.io/python/' + media.location;
};

//exports
module.exports = TrinketMediaRenderer;
