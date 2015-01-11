
//dependencies
var process = require('process');
var url = require('url');
var HtmlEncoder = require('htmlencode');
var BaseMediaRenderer = require('./base_media_renderer.js');

/**
 *
 * @class StorifyMediaRenderer
 * @constructor
 */
function StorifyMediaRenderer(){}

/**
 * The media type supported by the provider
 * @private
 * @static
 * @property TYPE
 * @type {String}
 */
var TYPE = 'storify';

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
        width: "100%",
        height: "750px"
    },
    
    post: {
        width: "100%",
        height: "750px"
    }
});

/**
 * Retrieves the style for the specified type of view
 * @static
 * @meethod getStyle
 * @param {String} viewType The view type calling for a styling
 * @return {Object} a hash of style properties
 */
StorifyMediaRenderer.getStyle = function(viewType) {
    return STYLES[viewType] || STYLES.view;
};

StorifyMediaRenderer.getSupportedTypes = function() {
    var types = {};
    types[TYPE] = true;
    return types;
};

StorifyMediaRenderer.getName = function() {
    return 'StorifyMediaRenderer';
};

StorifyMediaRenderer.isSupported = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    return StorifyMediaRenderer.isFullSite(details);
};

StorifyMediaRenderer.isFullSite = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return parsedUrl.host.indexOf('storify.com') >= 0 && parsedUrl.pathname.indexOf('/') >= 0;
};


StorifyMediaRenderer.getType = function(urlStr) {
    return StorifyMediaRenderer.isSupported(urlStr) ? TYPE : null;
}

StorifyMediaRenderer.getIcon = function(type) {
    return 'arrow-circle-right';
};

StorifyMediaRenderer.renderByUrl = function(urlStr, options, cb) {
    StorifyMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        StorifyMediaRenderer.render({location: mediaId}, options, cb);
    });
};

StorifyMediaRenderer.render = function(media, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb = options;
        options = {};
    }
    
    var embedUrl = StorifyMediaRenderer.getEmbedUrl(media.location);
    cb(null, BaseMediaRenderer.renderIFrameEmbed(embedUrl, options.attrs, options.style));
};

StorifyMediaRenderer.getEmbedUrl = function(mediaId) {
    return '//storify.com/' + mediaId + '/embed?header=false&border=false';
};

StorifyMediaRenderer.getMediaId = function(urlStr, cb) {
    var details = url.parse(urlStr, true, true);
    var mediaId = details.pathname;
    if (mediaId.indexOf('/') === 0) {
        mediaId = mediaId.substring(1);
    }
    cb(null, mediaId);
};

StorifyMediaRenderer.getMeta = function(urlStr, isFile, cb) {
    var details = url.parse(urlStr, true, true);

    var meta = details.query;
    process.nextTick(function() {
        cb(null, meta);
    });
};

StorifyMediaRenderer.getThumbnail = function(urlStr, cb) {
    process.nextTick(function() {
        cb(null, '');
    });
};

StorifyMediaRenderer.getNativeUrl = function(media) {
    return 'https://storify.com/' + media.location;
};

//exports
module.exports = StorifyMediaRenderer;
