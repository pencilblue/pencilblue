
//dependencies
var process = require('process');
var url = require('url');
var https = require('https');
var HtmlEncoder = require('htmlencode');
var BaseMediaRenderer = require('./base_media_renderer.js');

/**
 *
 * @class SlideShareMediaRenderer
 * @constructor
 */
function SlideShareMediaRenderer(){}

/**
 * The media type supported by the provider
 * @private
 * @static
 * @property TYPE
 * @type {String}
 */
var TYPE = 'slideshare';

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
        width: "427px",
        height: "356px"
    },
    
    post: {
        width: "427px",
        height: "356px"
    }
});

/**
 * Retrieves the style for the specified type of view
 * @static
 * @meethod getStyle
 * @param {String} viewType The view type calling for a styling
 * @return {Object} a hash of style properties
 */
SlideShareMediaRenderer.getStyle = function(viewType) {
    return STYLES[viewType] || STYLES.view;
};

SlideShareMediaRenderer.getSupportedTypes = function() {
    var types = {};
    types[TYPE] = true;
    return types;
};

SlideShareMediaRenderer.getName = function() {
    return 'SlideShareMediaRenderer';
};

SlideShareMediaRenderer.isSupported = function(urlStr) {
    var details = url.parse(urlStr, true, true);
    return SlideShareMediaRenderer.isFullSite(details);
};

SlideShareMediaRenderer.isFullSite = function(parsedUrl) {
    if (pb.utils.isString(parsedUrl)) {
        parsedUrl = url.parse(urlStr, true, true);
    }
    return (parsedUrl.host.indexOf('slideshare.com') >= 0 || parsedUrl.host.indexOf('slideshare.net') >= 0) && parsedUrl.pathname.indexOf('/') >= 0;
};


SlideShareMediaRenderer.getType = function(urlStr) {
    return SlideShareMediaRenderer.isSupported(urlStr) ? TYPE : null;
}

SlideShareMediaRenderer.getIcon = function(type) {
    return 'list-alt';
};

SlideShareMediaRenderer.renderByUrl = function(urlStr, options, cb) {
    SlideShareMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        SlideShareMediaRenderer.render({location: mediaId}, options, cb);
    });
};

SlideShareMediaRenderer.render = function(media, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb = options;
        options = {};
    }
    
    var embedUrl = SlideShareMediaRenderer.getEmbedUrl(media.location);
    cb(null, BaseMediaRenderer.renderIFrameEmbed(embedUrl, options.attrs, options.style));
};

SlideShareMediaRenderer.getEmbedUrl = function(mediaId) {
    return '//www.slideshare.net/slideshow/embed_code/' + mediaId; 
};

SlideShareMediaRenderer.getMediaId = function(urlStr, cb) {
    SlideShareMediaRenderer.getDetails(urlStr, function(err, details) {console.log('***');console.log(details);
        if (util.isError(err)) {
            return cb(err);   
        }
        cb(null, details.slideshow_id);
    });
};

SlideShareMediaRenderer.getMeta = function(urlStr, isFile, cb) {
    var details = url.parse(urlStr, true, true);

    var meta = details.query;
    process.nextTick(function() {
        cb(null, meta);
    });
};

SlideShareMediaRenderer.getThumbnail = function(urlStr, cb) {
    SlideShareMediaRenderer.getDetails(urlStr, function(err, details) {
        if (util.isError(err)) {
            return cb(err);
        }
        cb(null, details.thumbnail);
    });
};

SlideShareMediaRenderer.getNativeUrl = function(media) {
    return 'http://slideshare.net/slideshow/embed_code/' + media.location;
};

SlideShareMediaRenderer.getDetails = function(urlStr, cb) {
    var options = {
        host: 'www.slideshare.net',
        path: '/api/oembed/2?url=' + encodeURIComponent(urlStr) + '&format=jsonp&callback=?'
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
                cb(null, data);
            }
            catch(err) {
                cb(err);
            }
        });
    };
    https.request(options, callback).end();
};

//exports
module.exports = SlideShareMediaRenderer;
