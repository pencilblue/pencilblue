/*
    Copyright (C) 2016  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

//dependencies
var url = require('url');

module.exports = function AudioMediaRendererModule(pb) {

    //pb dependencies
    var util              = pb.util;
    var BaseMediaRenderer = pb.media.renderers.BaseMediaRenderer;

    /**
     * Renders a media item that represents a DailyMotion video
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
     * Retrieves the supported extension types for the renderer.
     * @static
     * @method getSupportedExtensions
     * @return {Array}
     */
    DailyMotionMediaRenderer.getSupportedExtensions = function() {
        return [];
    };

    /**
     * Retrieves the style for the specified type of view
     * @static
     * @method getStyle
     * @param {String} viewType The view type calling for a styling
     * @return {Object} a hash of style properties
     */
    DailyMotionMediaRenderer.getStyle = function(viewType) {
        return STYLES[viewType] || STYLES.view;
    };

    /**
     * Retrieves the supported media types as a hash.
     * @static
     * @method getSupportedTypes
     * @return {Object}
     */
    DailyMotionMediaRenderer.getSupportedTypes = function() {
        var types = {};
        types[TYPE] = true;
        return types;
    };

    /**
     * Retrieves the name of the renderer.
     * @static
     * @method getName
     * @return {String}
     */
    DailyMotionMediaRenderer.getName = function() {
        return 'DailyMotionMediaRenderer';
    };

    /**
     * Determines if the URL to a media object is supported by this renderer
     * @static
     * @method isSupported
     * @param {String} urlStr
     * @return {Boolean} TRUE if the URL is supported by the renderer, FALSE if not
     */
    DailyMotionMediaRenderer.isSupported = function(urlStr) {
        var details = url.parse(urlStr, true, true);
        return DailyMotionMediaRenderer.isFullSite(details) || DailyMotionMediaRenderer.isLibyanDomain(details);
    };

    /**
     * Indicates if the passed URL to a media resource points to the main website
     * that provides the media represented by this media renderer
     * @static
     * @method isFullSite
     * @param {Object|String} parsedUrl The URL string or URL object
     * @return {Boolean} TRUE if URL points to the main domain and media resource, FALSE if not
     */
    DailyMotionMediaRenderer.isFullSite = function(parsedUrl) {
        if (util.isString(parsedUrl)) {
            parsedUrl = url.parse(urlStr, true, true);
        }
        return parsedUrl.host && parsedUrl.host.indexOf('dailymotion.com') >= 0 && parsedUrl.pathname.indexOf('/video/') === 0;
    };

    /**
     * Indicates if the passed URL to a media resource points to the website
     * that provides the media represented by this media renderer with a libyan
     * domain (.ly)
     * @static
     * @method isLibyanDomain
     * @param {Object|String} parsedUrl The URL string or URL object
     * @return {Boolean} TRUE if URL points to the main domain and media resource, FALSE if not
     */
    DailyMotionMediaRenderer.isLibyanDomain = function(parsedUrl) {
        if (util.isString(parsedUrl)) {
            parsedUrl = url.parse(urlStr, true, true);
        }
        return parsedUrl.host && parsedUrl.host.indexOf('dai.ly') >= 0 && parsedUrl.pathname.indexOf('/') >= 0;
    };

    /**
     * Gets the specific type of the media resource represented by the provided URL
     * @static
     * @method getType
     * @param {String} urlStr
     * @return {String}
     */
    DailyMotionMediaRenderer.getType = function(urlStr) {
        return DailyMotionMediaRenderer.isSupported(urlStr) ? TYPE : null;
    }

    /**
     * Retrieves the Font Awesome icon class.  It is safe to assume that the type
     * provided will be a supported type by the renderer.
     * @static
     * @method getIcon
     * @param {String} type
     * @return {String}
     */
    DailyMotionMediaRenderer.getIcon = function(type) {
        return 'play-circle-o';
    };

    /**
     * Renders the media resource via the raw URL to the resource
     * @static
     * @method renderByUrl
     * @param {String} urlStr
     * @param {Object} [options]
     * @param {Object} [options.attrs] A hash of all attributes (excluding style)
     * that will be applied to the element generated by the rendering
     * @param {Object} [options.style] A hash of all attributes that will be
     * applied to the style of the element generated by the rendering.
     * @param {Function} cb A callback where the first parameter is an Error if
     * occurred and the second is the rendering of the media resource as a HTML
     * formatted string
     */
    DailyMotionMediaRenderer.renderByUrl = function(urlStr, options, cb) {
        DailyMotionMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
            if (util.isError(err)) {
                return cb(err);
            }
            DailyMotionMediaRenderer.render({location: mediaId}, options, cb);
        });
    };

    /**
     * Renders the media resource via the media descriptor object.  It is only
     * guaranteed that the "location" property will be available at the time of
     * rendering.
     * @static
     * @method render
     * @param {Object} media
     * @param {String} media.location The unique resource identifier (only to the
     * media type) for the media resource
     * @param {Object} [options]
     * @param {Object} [options.attrs] A hash of all attributes (excluding style)
     * that will be applied to the element generated by the rendering
     * @param {Object} [options.style] A hash of all attributes that will be
     * applied to the style of the element generated by the rendering.
     * @param {Function} cb A callback where the first parameter is an Error if
     * occurred and the second is the rendering of the media resource as a HTML
     * formatted string
     */
    DailyMotionMediaRenderer.render = function(media, options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }

        var embedUrl = DailyMotionMediaRenderer.getEmbedUrl(media.location);
        cb(null, BaseMediaRenderer.renderIFrameEmbed(embedUrl, options.attrs, options.style));
    };

    /**
     * Retrieves the source URI that will be used when generating the rendering
     * @static
     * @method getEmbedUrl
     * @param {String} mediaId The unique (only to the type) media identifier
     * @return {String} A properly formatted URI string that points to the resource
     * represented by the media Id
     */
    DailyMotionMediaRenderer.getEmbedUrl = function(mediaId) {
        return '//www.dailymotion.com/embed/video/' + mediaId;
    };

    /**
     * Retrieves the unique identifier from the URL provided.  The value should
     * distinguish the media resource from the others of this type and provide
     * insight on how to generate the embed URL.
     * @static
     * @method getMediaId
     */
    DailyMotionMediaRenderer.getMediaId = function(urlStr, cb) {
        var details = url.parse(urlStr, true, true);
        cb(null, details.pathname.substr(details.pathname.lastIndexOf('/') + 1));
    };

    /**
     * Retrieves any meta data about the media represented by the URL.
     * @static
     * @method getMeta
     * @param {String} urlStr
     * @param {Boolean} isFile indicates if the URL points to a file that was
     * uploaded to the PB server
     * @param {Function} cb A callback that provides an Error if occurred and an
     * Object if meta was collected.  NULL if no meta was collected
     */
    DailyMotionMediaRenderer.getMeta = function(urlStr, isFile, cb) {
        var details = url.parse(urlStr, true, true);
        cb(null, details.query);
    };

    /**
     * Retrieves a URI to a thumbnail for the media resource
     * @static
     * @method getThumbnail
     * @param {String} urlStr
     * @param {Function} cb A callback where the first parameter is an Error if
     * occurred and the second is the URI string to the thumbnail.  Empty string or
     * NULL if no thumbnail is available
     */
    DailyMotionMediaRenderer.getThumbnail = function(urlStr, cb) {
        DailyMotionMediaRenderer.getMediaId(urlStr, function(err, mediaId) {
            cb(err, 'https://www.dailymotion.com/thumbnail/video/' + mediaId);
        });
    };

    /**
     * Retrieves the native URL for the media resource.  This can be the raw page
     * where it was found or a direct link to the content.
     * @static
     * @method getNativeUrl
     */
    DailyMotionMediaRenderer.getNativeUrl = function(media) {
        return 'http://dailymotion.com/video/' + media.location;
    };

    //exports
    return DailyMotionMediaRenderer;
};
