
//dependencies
var process = require('process');
var url = require('url');
var HtmlEncoder = require('htmlencode');
var BaseMediaRenderer = require('./base_media_renderer.js');

/**
 *
 * @class DailyMotionMediaRenderer
 * @constructor
 */
function DailyMotionMediaRenderer(){}

/**
 * The media type supported by the provider
 * @private
 * @static
 * @property TYPE
 * @type {String}
 */
var TYPE = 'daily_motion';

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
        width: "480px",
        height: "270px"
    },
    
    editor: {
        frameborder: "0",
        width: "480px",
        height: "270px"
    },
    
    post: {
        frameborder: "0",
        width: "480px",
        height: "270px"
    }
});

/**
 * Retrieves the style for the specified type of view
 * @static
 * @meethod getStyle
 * @param {String} viewType The view type calling for a styling
 * @return {Object} a hash of style properties
 */
DailyMotionMediaRenderer.getStyle = function(viewType) {
    return STYLES[viewType] || STYLES.view;
};

DailyMotionMediaRenderer.getSupportedTypes = function() {
    var types = {};
    types[TYPE] = true;
    return types;
};

DailyMotionMediaRenderer.getName = function() {
    return 'DailyMotionMediaRenderer';
};

DailyMotionMediaRenderer.isSupported = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    return DailyMotionMediaRenderer.isFullSite(details) || DailyMotionMediaRenderer.isLibyanDomain(details);
};

DailyMotionMediaRenderer.isFullSite = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return parsedUrl.host.indexOf('dailymotion.com') >= 0 && parsedUrl.pathname.indexOf('/video/') === 0;
};

DailyMotionMediaRenderer.isLibyanDomain = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return parsedUrl.host.indexOf('dai.ly') >= 0 && parsedUrl.pathname.indexOf('/') >= 0;
};

DailyMotionMediaRenderer.getType = function(urlStr) {
    return DailyMotionMediaRenderer.isSupported(urlStr) ? TYPE : null;
}

DailyMotionMediaRenderer.getIcon = function(type) {
    return 'play-circle-o';
};

DailyMotionMediaRenderer.renderByUrl = function(urlStr, options, cb) {
    DailyMotionMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        DailyMotionMediaRenderer.render({location: mediaId}, options, cb);
    });
};

DailyMotionMediaRenderer.render = function(media, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb = options;
        options = {};
    }
    
    var embedUrl = DailyMotionMediaRenderer.getEmbedUrl(media.location);
    cb(null, BaseMediaRenderer.renderIFrameEmbed(embedUrl, options.attrs, options.style));
};

DailyMotionMediaRenderer.getEmbedUrl = function(mediaId) {
    return '//www.dailymotion.com/embed/video/' + mediaId;
};

DailyMotionMediaRenderer.getMediaId = function(urlStr, cb) {
    var details = url.parse(urlStr, true, true);
    cb(null, details.pathname.substr(details.pathname.lastIndexOf('/') + 1));
};

DailyMotionMediaRenderer.getMeta = function(urlStr, isFile, cb) {
    var details = url.parse(urlStr, true, true);

    var meta = details.query;
    process.nextTick(function() {
        cb(null, meta);
    });
};

DailyMotionMediaRenderer.getThumbnail = function(urlStr, cb) {
    DailyMotionMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        cb(err, 'https://www.dailymotion.com/thumbnail/video/' + mediaId);
    });
};

DailyMotionMediaRenderer.getNativeUrl = function(media) {
    return 'http://dailymotion.com/video/' + media.location;
};

//exports
module.exports = DailyMotionMediaRenderer;
