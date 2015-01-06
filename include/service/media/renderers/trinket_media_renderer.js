
//dependencies
var process = require('process');
var url = require('url');
var HtmlEncoder = require('htmlencode');

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

TrinketMediaRenderer.renderByUrl = function(urlStr, props, cb) {
    TrinketMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        TrinketMediaRenderer.render({location: mediaId}, props, cb);
    });
};

TrinketMediaRenderer.render = function(media, props, cb) {
    if (pb.utils.isFunction(props)) {
        cb = props;
        props = {};
    }
    
    var embedUrl = TrinketMediaRenderer.getEmbedUrl(media.location);
    var html = '<div class="embed-responsive embed-responsive-16by9"><iframe src="' + embedUrl + '" ';
    for (var prop in props) {
        html += prop + '="' + HtmlEncoder.htmlEncode(props[prop]) + '" ';
    }
    html += '/></div>';
    
    cb(null, html);
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
