
//dependencies
var process = require('process');
var url = require('url');
var HtmlEncoder = require('htmlencode');

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

VimeoMediaRenderer.renderByUrl = function(urlStr, props, cb) {
    VimeoMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
        if (util.isError(err)) {
            return cb(err);
        }
        VimeoMediaRenderer.render({location: mediaId}, props, cb);
    });
};

VimeoMediaRenderer.render = function(media, props, cb) {
    if (pb.utils.isFunction(props)) {
        cb = props;
        props = {};
    }
    
    var embedUrl = VimeoMediaRenderer.getEmbedUrl(media.location);
    var html = '<div class="embed-responsive embed-responsive-16by9"><iframe src="' + embedUrl + '" ';
    for (var prop in props) {
        html += prop + '="' + HtmlEncoder.htmlEncode(props[prop]) + '" ';
    }
    html += '/></div>';
    
    cb(null, html);
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
    var mediaId = VimeoMediaRenderer.getMediaId(urlStr);
    
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
};

VimeoMediaRenderer.getNativeUrl = function(media) {
    return 'http://vimeo.com/' + media.location;
};

//exports
module.exports = VimeoMediaRenderer;
