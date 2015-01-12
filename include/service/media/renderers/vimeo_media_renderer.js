
//dependencies
var process = require('process');
var url = require('url');
var BaseMediaRenderer = require('./base_media_renderer.js');

/**
 *
 * @class VimeoMediaRenderer
 * @constructor
 */
function VimeoMediaRenderer(){}

/**
 * The media type supported by the provider
 * @private
 * @static
 * @property TYPE
 * @type {String}
 */
var TYPE = 'vimeo';

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
        'max-height': "500px"
    },
    
    editor: {
        width: "500px",
        height: "281px"
    },
    
    post: {
        width: "500px",
        height: "281px"
    }
});

/**
 * Retrieves the style for the specified type of view
 * @static
 * @meethod getStyle
 * @param {String} viewType The view type calling for a styling
 * @return {Object} a hash of style properties
 */
VimeoMediaRenderer.getStyle = function(viewType) {
    return STYLES[viewType] || STYLES.view;
};

VimeoMediaRenderer.getSupportedTypes = function() {
    var types = {};
    types[TYPE] = true;
    return types;
};

VimeoMediaRenderer.getName = function() {
    return 'VimeoMediaRenderer';
};

VimeoMediaRenderer.isSupported = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    return VimeoMediaRenderer.isFullSite(details);
};

VimeoMediaRenderer.isFullSite = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return parsedUrl.host.indexOf('vimeo.com') >= 0 && parsedUrl.pathname.indexOf('/') >= 0;
};


VimeoMediaRenderer.getType = function(urlStr) {
    return VimeoMediaRenderer.isSupported(urlStr) ? TYPE : null;
}

VimeoMediaRenderer.getIcon = function(type) {
    return 'vimeo-square';
};

VimeoMediaRenderer.renderByUrl = function(urlStr, options, cb) {
    VimeoMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        VimeoMediaRenderer.render({location: mediaId}, options, cb);
    });
};

VimeoMediaRenderer.render = function(media, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb = options;
        options = {};
    }
    
    var embedUrl = VimeoMediaRenderer.getEmbedUrl(media.location);
    cb(null, BaseMediaRenderer.renderIFrameEmbed(embedUrl, options.attrs, options.style));
};

VimeoMediaRenderer.getEmbedUrl = function(mediaId) {
    return '//player.vimeo.com/video/' + mediaId;
};

VimeoMediaRenderer.getMediaId = function(urlStr, cb) {
    var details = url.parse(urlStr, true, true);
    cb(null, details.pathname.substr(details.pathname.lastIndexOf('/') + 1));
};

VimeoMediaRenderer.getMeta = function(urlStr, isFile, cb) {
    var details = url.parse(urlStr, true, true);

    var meta = details.query;
    process.nextTick(function() {
        cb(null, meta);
    });
};

VimeoMediaRenderer.getThumbnail = function(urlStr, cb) {
    VimeoMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        
        var options = {
            host: 'vimeo.com',
            path: '/api/v2/video/' + mediaId + '.json'
        };
        var callback = function(response) {
            var str = '';

            //another chunk of data has been recieved, so append it to `str`
            response.once('error', cb);
            response.on('data', function (chunk) {
                str += chunk;
            });

            //the whole response has been recieved, so we just print it out here
            response.on('end', function () {
                try {
                    var data = JSON.parse(str);
                    cb(null, data[0].thumbnail_medium);
                }
                catch(err) {
                    cb(err);
                }
            });
        };
        http.request(options, callback).end();
    });
};

VimeoMediaRenderer.getNativeUrl = function(media) {
    return 'http://vimeo.com/' + media.location;
};

//exports
module.exports = VimeoMediaRenderer;
