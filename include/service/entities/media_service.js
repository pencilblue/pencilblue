/*
	Copyright (C) 2015  PencilBlue, LLC

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
var http  = require('http');
var fs    = require('fs');
var path  = require('path');
var async = require('async');
var util  = require('../../util.js');

module.exports = function MediaServiceModule(pb) {

    /**
     * Provides information on media
     *
     * @module Services
     * @submodule Entities
     * @class MediaService
     * @constructor
     * @param provider
     * @param site          Site uid to be used for this service
     * @param onlyThisSite  Whether this service should only return media associated with specified site
     *                      or fallback to global if not found in specified site
     */
    function MediaService(provider, site, onlyThisSite) {

        /**
         * @property site
         * @type {String}
         */
        this.site = pb.SiteService.getCurrentSite(site);

        var context = {
            site: this.site,
            onlyThisSite: onlyThisSite
        };

        /**
         * @property siteQueryService
         * @type {SiteQueryService}
         */
        this.siteQueryService = new pb.SiteQueryService(context);

        if (util.isNullOrUndefined(provider)) {
            provider = MediaService.loadMediaProvider(context);
        }
        if (!provider) {
            throw new Error('A valid media provider is required. Please check your configuration');
        }

        /**
         * @property provider
         * @type {MediaProvider}
         */
        this.provider = provider;
    }

    /**
     * @deprecated
     * @private
     * @static
     * @property INSTANCE
     * @type {MediaProvider}
     */
    var INSTANCE = null;

    /**
     * The collection where media descriptors are persisted
     * @static
     * @readonly
     * @property COLL
     * @type {String}
     */
    MediaService.COLL = 'media';

    /**
     * @private
     * @static
     * @property MEDIA_PROVIDERS
     * @type {Object}
     */
    var MEDIA_PROVIDERS = Object.freeze({
        fs: pb.media.providers.FsMediaProvider,
        mongo: pb.media.providers.MongoMediaProvider
    });

    /**
     * Contains the list of media renderers
     * @private
     * @static
     * @property REGISTERED_MEDIA_RENDERERS
     * @type {Array}
     */
    var REGISTERED_MEDIA_RENDERERS = [
        pb.media.renderers.ImageMediaRenderer,
        pb.media.renderers.VideoMediaRenderer,
        pb.media.renderers.YouTubeMediaRenderer,
        pb.media.renderers.DailyMotionMediaRenderer,
        pb.media.renderers.VimeoMediaRenderer,
        pb.media.renderers.VineMediaRenderer,
        pb.media.renderers.InstagramMediaRenderer,
        pb.media.renderers.SlideShareMediaRenderer,
        pb.media.renderers.TrinketMediaRenderer,
        pb.media.renderers.StorifyMediaRenderer,
        pb.media.renderers.KickStarterMediaRenderer,
        pb.media.renderers.PdfMediaRenderer
    ];

    /**
     * Loads a media descriptor by ID.
     * @method loadById
     * @param {String|ObjectID} mid Media descriptor ID
     * @param {Function} cb A callback that provides two parameters: an Error, if
     * occurred and a media descriptor if found.
     */
    MediaService.prototype.loadById = function(mid, cb) {
        this.siteQueryService.loadById(mid.toString(), MediaService.COLL, cb);
    };

    /**
     * Deletes a media descriptor by ID
     * @method deleteById
     * @param {String|ObjectID} mid
     * @param {Object} [options]
     * @param {Function} cb
     */
    MediaService.prototype.deleteById = function(mid, options, cb) {
        if (util.isFunction(options)) {
            cb     = options;
            optons = {delete_content: true};
        }

        var self = this;
        self.siteQueryService.deleteById(mid, MediaService.COLL, cb);
    };

    /**
     * Persists a media descriptor
     * @method save
     * @param {Object} media
     * @param {Object} [options]
     * @param {Function} cb
     */
    MediaService.prototype.save = function(media, options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }

        var self = this;
        self.validate(media, function(err, validationErrors) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (validationErrors.length) {
                return cb(null, validationErrors);
            }

            self.siteQueryService.save(media, cb);
        });
    };

    /**
     * Validates a media descriptor
     * @method validate
     * @param {Object} media
     * @param {Function} cb A callback that provides two parameters: an Error, if
     * occurred.  The second is an array of validation error objects.
     */
    MediaService.prototype.validate = function(media, cb) {
        var errors = [];

        if (!util.isObject(media)) {
            errors.push(pb.CustomObjectService.err('', 'The descriptor must be an object'));
            return cb(null, errors);
        }

        //ensure the media name is unique
        var where = { name: media.name };
        this.siteQueryService.unique(MediaService.COLL, where, media[pb.DAO.getIdField()], function(err, isUnique) {
            if(util.isError(err)) {
                return cb(err, errors);
            }
            else if(!isUnique) {
                errors.push(pb.CustomObjectService.err('name', 'The name ' + media.name + ' is already in use'));
            }

            //TODO validate the other properties
            cb(null, errors);
        });
    };

    /**
     * Queries for media descriptors
     * @method get
     * @param {Object} [options]
     * @param {Object} [options.where]
     * @param {Array} [options.order]
     * @param {Object} [options.select]
     * @param {Integer} [options.limit]
     * @param {Integer} [options.offset]
     * @param {Boolean} [options.format_media=true]
     * @param cb
     */
    MediaService.prototype.get = function(options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {
                format_media: true,
                order: {name: 1}
            };
        }

        this.siteQueryService.q('media', options, function (err, media) {
            if (util.isError(err)) {
                return cb(err, []);
            }

            //set the link and icon if specified
            if (options.format_media) {
                MediaService.formatMedia(media);
            }
            cb(null, media);
        });
    };

    /**
     *
     * @method getContentByPath
     * @param {String} mediaPath
     * @param {Function} cb
     */
    MediaService.prototype.getContentByPath = function(mediaPath, cb) {
        this.provider.get(mediaPath, cb);
    };

    /**
     *
     * @method getContentStreamByPath
     * @param {String} mediaPath
     * @param {Function} cb
     */
    MediaService.prototype.getContentStreamByPath = function(mediaPath, cb) {
        this.provider.getStream(mediaPath, cb);
    };

    /**
     *
     * @method setContent
     * @param {String|Buffer} fileDataStrOrBuff
     * @param {String} fileName
     * @param {Function} cb
     */
    MediaService.prototype.setContent = function(fileDataStrOrBuff, fileName, cb) {
        var mediaPath = MediaService.generateMediaPath(fileName);
        this.provider.set(fileDataStrOrBuff, mediaPath, function(err, result) {
            cb(err, { mediaPath: mediaPath, result: result});
        });
    };

    /**
     *
     * @method setContentStream
     * @param {Stream} stream
     * @param {String} fileName
     * @param {Function} cb
     */
    MediaService.prototype.setContentStream = function(stream, fileName, cb) {
        var mediaPath = MediaService.generateMediaPath(fileName);
        this.provider.setStream(stream, mediaPath, function(err, result) {
            cb(err, { mediaPath: mediaPath, result: result});
        });
    };

    /**
     *
     * @method createContentWriteStream
     * @param {String} fileName
     * @param {Function} cb
     */
    MediaService.prototype.createContentWriteStream = function(fileName, cb) {
        var mediaPath = MediaService.generateMediaPath(fileName);
        this.provider.createWriteStream(mediaPath, function(err, stream) {
            var result = {
                mediaPath: mediaPath,
                stream: stream
            };
            cb(err, result);
        });
    };

    /**
     *
     * @method existsByPath
     * @param {String} mediaPath
     * @param {Function} cb
     */
    MediaService.prototype.existsByPath = function(mediaPath, cb) {
        this.provider.exists(mediaPath, cb);
    };

    /**
     *
     * @method deleteContentByPath
     * @param {String} mediaPath
     * @param {Function} cb
     */
    MediaService.prototype.deleteContentByPath = function(mediaPath, cb) {
        this.provider.delete(mediaPath, cb);
    };

    /**
     *
     * @method statByPath
     * @param {String} mediaPath
     * @param {Function} cb
     */
    MediaService.prototype.statByPath = function(mediaPath, cb) {
        this.provider.stat(mediaPath, cb);
    };

    /**
     * Retrieves whether a media's file path is valid
     *
     * @method isValidFilePath
     * @param {String}   mediaPath The file path of the media
     * @param {Function} cb        Callback function
     */
    MediaService.prototype.isValidFilePath = function(mediaPath, cb) {
        var absolutePath = path.join(pb.config.docRoot, 'public', mediaPath);
        fs.exists(absolutePath, function(exists) {
            cb(null, exists);
        });
    };

    /**
     * Registers a media renderer
     * @static
     * @method registerRenderer
     * @param {Function|Object} interfaceImplementation A prototype or object that implements the media renderer interface.
     * @return {Boolean} TRUE if the implementation was registered, FALSE if not
     */
    MediaService.registerRenderer = function(interfaceImplementation) {
        if (!interfaceImplementation) {
            return false;
        }

        REGISTERED_MEDIA_RENDERERS.push(interfaceImplementation);
        return true;
    };

    /**
     * Indicates if a media renderer is already registered
     * @static
     * @method isRegistered
     * @param {Function|Object} interfaceImplementation A prototype or object that implements the media renderer interface
     * @return {Boolean} TRUE if registered, FALSE if not
     */
    MediaService.isRegistered = function(interfaceImplementation) {
        return REGISTERED_MEDIA_RENDERERS.indexOf(interfaceImplementation) >= 0;
    };

    /**
     * Unregisters a media renderer
     * @static
     * @method unregisterRenderer
     * @param {Function|Object} interfaceImplementation A prototype or object that implements the media renderer interface
     * @return {Boolean} TRUE if unregistered, FALSE if not
     */
    MediaService.unregisterRenderer = function(interfaceToUnregister) {
        var index = REGISTERED_MEDIA_RENDERERS.indexOf(interfaceToUnregister);
        if (index >= 0) {
            REGISTERED_MEDIA_RENDERERS.splice(index, 1);
            return true;
        }
        return false;
    };

    /**
     * Determines if the media URI is a file.  It is determined to be a file if and
     * only if the URI does not begin with "http" or "//".
     * @static
     * @method isFile
     * @param {String} mediaUrl A URI string that points to a media resource
     */
    MediaService.isFile = function(mediaUrl) {
        return mediaUrl.indexOf('http') !== 0 && mediaUrl.indexOf('//') !== 0;
    };

    /**
     * Generates a media descriptor for a given media URL
     * @method getMediaDescriptor
     * @param {String} mediaURL
     * @param {Boolean} isFile Indicates if the media resource was uploaded to the server.
     * @param {Function} cb A callback with two parameters. First, an Error if
     * occurred and second is an object that describes the media resource described
     * by the given media URL
     */
    MediaService.prototype.getMediaDescriptor = function(mediaUrl, cb) {

        //get the type
        var isFile = mediaUrl.indexOf('http') !== 0 && mediaUrl.indexOf('//') !== 0;
        var result = MediaService.getRenderer(mediaUrl, isFile);
        if (result === null) {
            pb.log.warn('MediaService: No media renderer could be found for URI [%s]', mediaUrl);
            return cb(null, null);
        }

        var renderer = result.renderer;
        var tasks = {

            meta: function(callback) {
                renderer.getMeta(mediaUrl, isFile, callback);
            },

            thumbnail: function(callback) {
                renderer.getThumbnail(mediaUrl, callback);
            },

            mediaId: function(callback) {
                renderer.getMediaId(mediaUrl, callback);
            }
        };
        async.series(tasks, function(err, taskResult) {
            var descriptor = {
                type: result.type,
                media_type: result.type,
                isFile: isFile,
                is_file: isFile,
                url: mediaUrl,
                icon: renderer.getIcon(result.type),
                thumbnail: taskResult.thumbnail,
                location: taskResult.mediaId,
                meta: taskResult.meta
            };
            cb(err, descriptor);
        });
    };

    /**
     * Renders a resource by type and location (mediaId).
     * @method renderByLocation
     * @param {Object} options
     * @param {String} options.location The unique media identifier for the type
     * @param {String} [options.type] The type of provider that knows how to render
     * the resource
     * @param {Object} [options.attrs] The desired HTML attributes that will be
     * added to the element that provides the rendering
     * @param {Object} [options.style] The desired style overrides for the media
     * @param {String} [options.view] The view type that the media will be rendered
     * for (view, editor, post).  Any style options provided will override those
     * provided by the default style associated with the view.
     * @param {Function} cb A callback that provides two parameters.  An Error if
     * exists and the rendered HTML content for the media resource.
     */
    MediaService.prototype.renderByLocation = function(options, cb) {
        var result = options.type ? MediaService.getRendererByType(options.type) : MediaService.getRenderer(mediaUrl);
        if (!result) {
            return cb(null, null);
        }

        //set style properties if we can
        if (options.view) {
            options.style = MediaService.getStyleForView(result.renderer, options.view, options.style);
        }

        result.renderer.render(options, options, cb);
    };

    /**
     * Renders a media resource by ID where ID refers the to the media descriptor
     * id.
     * @method renderById
     * @param {String} The media resource ID
     * @param {Object} options
     * @param {Object} [options.attrs] The desired HTML attributes that will be
     * added to the element that provides the rendering
     * @param {Object} [options.style] The desired style overrides for the media
     * @param {String} [options.view] The view type that the media will be rendered
     * for (view, editor, post).  Any style options provided will override those
     * provided by the default style associated with the view.
     * @param {Function} cb A callback that provides two parameters. An Error if
     * exists and the rendered HTML content for the media resource.
     */
    MediaService.prototype.renderById = function(id, options, cb) {
        var self = this;

        self.siteQueryService.loadById(id, MediaService.COLL, function (err, media) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (!media) {
                return cb(null, null);
            }

            //render
            self.render(media, options, cb);
        });
    };

    /**
     * Renders the media represented by the provided media flag
     * @method render
     * @param {String} The media resource ID
     * @param {Object} options
     * @param {Object} [options.attrs] The desired HTML attributes that will be
     * added to the element that provides the rendering
     * @param {Object} [options.style] The desired style overrides for the media
     * @param {String} [options.view] The view type that the media will be rendered
     * for (view, editor, post).  Any style options provided will override those
     * provided by the default style associated with the view.
     * @param {Function} cb A callback that provides two parameters. An Error if
     * exists and the rendered HTML content for the media resource.
     */
    MediaService.prototype.renderByFlag = function(flag, options, cb) {
        if (util.isString(flag)) {
            flag = MediaService.parseMediaFlag(flag);
        }
        if (!flag) {
            return cb(new Error('An invalid flag was passed'));
        }

        //check for absense of props
        if (util.isFunction(options)) {
            cb = options;
            options = {
                style: {}
            };
        }

        //ensure the max height is set if explicity set for media replacement
        if (flag.style.maxHeight) {
            options.style['max-height'] = flag.style.maxHeight;
        }
        this.renderById(flag.id, options, cb);
    };

    /**
     * Renders the media represented by the provided media descriptor.
     * @method render
     * @param {String} The media resource ID
     * @param {Object} options
     * @param {Object} [options.attrs] The desired HTML attributes that will be
     * added to the element that provides the rendering
     * @param {Object} [options.style] The desired style overrides for the media
     * @param {String} [options.view] The view type that the media will be rendered
     * for (view, editor, post).  Any style options provided will override those
     * provided by the default style associated with the view.
     * @param {Function} cb A callback that provides two parameters. An Error if
     * exists and the rendered HTML content for the media resource.
     */
    MediaService.prototype.render = function(media, options, cb) {
        //retrieve renderer
        var result = MediaService.getRendererByType(media.media_type);
        if (!result) {
            return cb(null, null);
        }

        //set style properties if we can
        if (options.view) {
            options.style = MediaService.getStyleForView(result.renderer, options.view, options.style);
        }

        //render media
        result.renderer.render(media, options, cb);
    };

    /**
     * Retrieves the base style for the given renderer and view.  Overrides will be
     * applied on top of the base style.
     * @static
     * @method getStyleForView
     * @param {MediaRenderer} renderer An implementation of MediaRenderer
     * @param {String} view The view to retrieve the default styling for (view,
     * editor, post)
     * @param {Object} [overrides] A hash of style properties that will be applied
     * to the base style for the given view
     */
    MediaService.getStyleForView = function(renderer, view, overrides) {
        if (!overrides) {
            overrides = {};
        }

        var base = renderer.getStyle(view);
        var clone = util.clone(base);
        util.merge(overrides, clone);
        return clone;
    };

    /**
     * Retrieves a media renderer for the specified type
     * @static
     * @method getRendererByType
     * @param {String} type The media type
     * @return {MediaRenderer} A media renderer interface implementation or NULL if
     * none support the given type.
     */
    MediaService.getRendererByType = function(type) {
        for (var i = 0; i < REGISTERED_MEDIA_RENDERERS.length; i++) {

            var types = REGISTERED_MEDIA_RENDERERS[i].getSupportedTypes();
            if (types && types[type]) {

                pb.log.silly('MediaService: Selected media renderer [%s] for type [%s]', REGISTERED_MEDIA_RENDERERS[i].getName(), type);
                return {
                    type: type,
                    renderer: REGISTERED_MEDIA_RENDERERS[i]
                };
            }
        }

        pb.log.warn('MediaService: Failed to select media renderer type [%s]', type);
        return null;
    };

    /**
     * Retrieves a media renderer for the specified URL
     * @static
     * @method getRendererByType
     * @param {String} mediaUrl The media URL
     * @param {Boolean} isFile TRUE if the URL represents an uploaded file, FALSE if not
     * @return {MediaRenderer} A media renderer interface implementation or NULL if
     * none support the given URL.
     */
    MediaService.getRenderer = function(mediaUrl, isFile) {
        if (typeof isFile === 'undefined') {
            isFile = MediaService.isFile(mediaUrl);
        }

        for (var i = 0; i < REGISTERED_MEDIA_RENDERERS.length; i++) {

            var t = REGISTERED_MEDIA_RENDERERS[i].getType(mediaUrl, isFile);
            if (t !== null) {

                pb.log.silly('MediaService: Selected media renderer [%s] for URI [%s]', REGISTERED_MEDIA_RENDERERS[i].getName(), mediaUrl);
                return {
                    type: t,
                    renderer: REGISTERED_MEDIA_RENDERERS[i]
                };
            }
        }

        pb.log.warn('MediaService: Failed to select media renderer URI [%s]', mediaUrl);
        return null;
    };

    /**
     * Generates a media placeholder for templating
     * @static
     * @method getMediaFlag
     * @param {String} mid The media descriptor ID
     * @param {Object} [options] The list of attributes to be provided to the
     * rendering element.
     * @return {String}
     */
    MediaService.getMediaFlag = function(mid, options) {
        if (!mid) {
            throw new Error('The media id is required but ['+mid+'] was provided');
        }
        else if (!util.isObject(options)) {
            options = {};
        }

        var flag = '^media_display_'+mid+'/';

        var cnt = 0;
        for (var opt in options) {
            if (cnt++ > 0) {
                flag += ',';
            }
            flag += opt + ':' + options[opt];
        }
        flag += '^';
        return flag;
    };

    /**
     * Given a content string the function will search for and extract the first
     * occurance of a media flag. The parsed value that is returned will include:
     * <ul>
     * <li>startIndex - The index where the flag was found to start</li>
     * <li>endIndex - The position in the content string of the last character of the media flag</li>
     * <li>flag - The entire media flag including the start and end markers</li>
     * <li>id - The media descriptor id that is referenced by the media flag</li>
     * <li>style - A hash of the style properties declared for the flag</li>
     * <li>cleanFlag - The media flag stripped of the start and end markers</li>
     * </ul>
     * @static
     * @method extractNextMediaFlag
     * @param {String} content The content string that potentially contains 1 or more media flags
     * @return {Object} An object that contains the information about the parsed media flag.
     */
    MediaService.extractNextMediaFlag = function(content) {
        if (!util.isString(content)) {
            return null;
        }

        //ensure a media tags exists
        var prefix = '^media_display_';
        var startIndex = content.indexOf(prefix);
        if (startIndex < 0) {
            return null;
        }

        //ensure media tag is properly terminated
        var endIndex = content.indexOf('^', startIndex + 1);
        if (endIndex < 0) {
            return null;
        }

        var flag   = content.substring(startIndex, endIndex + 1);
        var result = MediaService.parseMediaFlag(flag);
        if (result) {
            result.startIndex = startIndex;
            result.endIndex = endIndex;
            result.flag = flag;
        }
        return result;
    };

    /**
     * Parses a media flag and returns each part in an object. The parsed value that
     * is returned will include:
     * <ul>
     * <li>id - The media descriptor id that is referenced by the media flag</li>
     * <li>style - A hash of the style properties declared for the flag</li>
     * <li>cleanFlag - The media flag stripped of the start and end markers</li>
     * </ul>
     * @static
     * @method .
     * @param {String} content The content string that potentially contains 1 or more media flags
     * @return {Object} An object that contains the information about the parsed media flag.
     */
    MediaService.parseMediaFlag = function(flag) {
        if (!util.isString(flag)) {
            return null;
        }

        //strip flag start and end markers if exist
        var hasStartMarker = flag.charAt(0) === '^';
        var hasEndMarker   = flag.charAt(flag.length - 1) === '^';
        flag = flag.substring(hasStartMarker ? 1 : 0, hasEndMarker ? flag.length - 1 : undefined);

        //split on forward slash as it is the division between id and style
        var prefix = 'media_display_';
        var parts = flag.split('/');
        var id    = parts[0].substring(prefix.length);

        var style = {};
        if (parts[1] && parts[1].length) {
            var attrs = parts[1].split(',').forEach(function(item) {
                var division = item.split(':');
                style[division[0]] = division[1];
            });
        }

        return {
            id: id,
            style: style,
            cleanFlag: flag
        };
    };

    /**
     * The default editor implementations all for three position values to declared
     * for embeded media (none, left, right, center).  These values map to HTML
     * alignments.  This function retrieves the HTML style attribute for the
     * provided position.
     * @static
     * @method getStyleForPosition
     * @param {String} position Can be one of 4 values: none, left, right, center
     * @return {String} The HTML formatted style attribute(s)
     */
    MediaService.getStyleForPosition = function(position) {
        var positionToStyle = {
            left: 'float: left;margin-right: 1em',
            right: 'float: right;margin-left: 1em',
            center: 'text-align: center'
        };
        return positionToStyle[position] || '';
    };

    /**
     * Generates the path to uploaded media
     * @static
     * @method generateMediaPath
     * @param {String} originalFilename
     * @return {String}
     */
    MediaService.generateMediaPath = function(originalFilename) {
        var now = new Date();
        var filename  = MediaService.generateFilename(originalFilename);
        return pb.UrlService.urlJoin('/media', now.getFullYear() + '', (now.getMonth() + 1) + '', filename);
    };

    /**
     * Generates a filename for a new media object
     * @static
     * @method generateFilename
     * @param {String} originalFilename
     * @return {String}
     */
    MediaService.generateFilename = function(originalFilename){
        var now = new Date();

        //calculate extension
        var ext = '';
        var extIndex = originalFilename.lastIndexOf('.');
        if (extIndex >= 0){
            ext = originalFilename.substr(extIndex);
        }

        //build file name
        return util.uniqueId() + '-' + now.getTime() + ext;
    };

    /**
     * Retrieves the font awesome icon for the media type.
     * @static
     * @method getMediaIcon
     * @param {String} mediaType
     * @return {String}
     */
    MediaService.getMediaIcon = function(mediaType) {

        var result = MediaService.getRendererByType(mediaType);
        if (!result) {
            return '';
        }
        return result.renderer.getIcon(mediaType);
    };

    /**
     * Sets the proper icon and link for an array of media items
     * @static
     * @method formatMedia
     * @param {Array} media The array of media objects to format
     * @return {Array} The same array of media that was passed in
     */
    MediaService.formatMedia = function(media) {
        var quickLookup = {};
        media.forEach(function(item) {

            //get the renderer
            var renderer = quickLookup[item.media_type];
            if (!renderer) {
                var result = MediaService.getRendererByType(item.media_type);
                if (!result) {
                    pb.log.warn('MediaService: Media item [%s] contains an unsupported media type.', media[pb.DAO.getIdField()]);
                }
                else {
                    quickLookup[item.media_type] = renderer = result.renderer;
                }
            }

            item.icon = renderer ? renderer.getIcon(item.media_type) : 'question';
            item.link = renderer ? renderer.getNativeUrl(item) : '#';
        });
        return media;
    };

    /**
     * Provides a mechanism to retrieve all of the supported extension types
     * that can be uploaded into the system.
     * @static
     * @method getSupportedExtensions
     * @returns {Array} provides an array of strings
     */
    MediaService.getSupportedExtensions = function() {

        var extensions = {};
        REGISTERED_MEDIA_RENDERERS.forEach(function(provider) {

            //for backward compatibility check for existence of extension retrieval
            if (!util.isFunction(provider.getSupportedExtensions)) {
                pb.log.warn('MediaService: Renderer %s does provide an implementation for getSupportedExtensions', provider.getName());
                return;
            }

            //retrieve the extensions
            var exts = provider.getSupportedExtensions();
            if (!util.isArray(exts)) {
                return;
            }

            //add them to the hash
            exts.forEach(function(extension) {
                extensions[extension] = true;
            });
        });

        return Object.keys(extensions);
    };

    /**
     * Retrieves the singleton instance of MediaProvider.
     * @deprecated
     * @static
     * @method getInstance
     * @param {Object} [context]
     * @return {MediaProvider}
     */
    MediaService.getInstance = function(context) {
        pb.log.warn('MediaService: the "getInstance" function is deprecated as of 0.5.0 and will be removed in the next version');
        if (INSTANCE) {
            return INSTANCE;
        }

        INSTANCE = MediaService.loadMediaProvider(context || {});
        if (INSTANCE === null) {
            throw new Error('A valid media provider was not available: PROVIDER_PATH: '+pb.config.media.provider+' TRIED='+JSON.stringify(paths));
        }
    };

    /**
     *
     * @static
     * @method loadMediaProvider
     * @param {Object} context
     * @param {String} context.site
     * @return {MediaProvider} An instance of a media provider or NULL when no
     * provider can be loaded.
     */
    MediaService.loadMediaProvider = function(context) {
        var ProviderType = MEDIA_PROVIDERS[pb.config.media.provider];
        if (util.isNullOrUndefined(ProviderType)) {
            ProviderType = MediaService.findProviderType();
        }
        return !!ProviderType ? new ProviderType(context) : null;
    };

    /**
     * Looks up the prototype for the media provider based on the configuration
     * @static
     * @method findProviderType
     * @return {MediaProvider}
     */
    MediaService.findProviderType = function() {
        var instance = null;
        var paths = [path.join(pb.config.docRoot, pb.config.media.provider), pb.config.media.provider];
        for(var i = 0; i < paths.length; i++) {
            try{
                return require(paths[i])(pb);
            }
            catch(e){
                pb.log.silly(e.stack);
            }
        }
        return null;
    };

    //exports
    return MediaService;
};
