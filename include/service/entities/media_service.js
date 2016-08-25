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
var http  = require('http');
var fs    = require('fs');
var path  = require('path');
var async = require('async');
var util  = require('../../util.js');

module.exports = function MediaServiceModule(pb) {

    /**
     * Provides information on media
     * @deprecated
     * @class MediaService
     * @constructor
     * @param {MediaProvider} provider
     * @param {string} site Site uid to be used for this service
     * @param {boolean} onlyThisSite Whether this service should only return media associated with specified site
     * or fallback to global if not found in specified site
     */
    function MediaService(provider, site, onlyThisSite) {
        pb.log.warn('MediaService is deprecated. Please use MediaServiceV2');

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
            provider = pb.MediaServiceV2.loadMediaProvider(context);
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
     * The collection where media descriptors are persisted
     * @static
     * @readonly
     * @property COLL
     * @type {String}
     */
    MediaService.COLL = 'media';

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
     * @param {Object} [options] not used in implementation
     * @param {Function} cb
     */
    MediaService.prototype.deleteById = function(mid, options, cb) {
        if (util.isFunction(options)) {
            cb     = options;
            options = {delete_content: true};
        }

        var self = this;
        self.siteQueryService.deleteById(mid, MediaService.COLL, cb);
    };

    /**
     * Persists a media descriptor
     * @method save
     * @param {Object} media
     * @param {Object} [options] Options object is not actually used in this implementation
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
                order: [['name', 1]]
            };
        }

        this.siteQueryService.q('media', options, function (err, media) {
            if (util.isError(err)) {
                return cb(err, []);
            }

            //set the link and icon if specified
            if (options.format_media) {
                pb.MediaServiceV2.formatMedia(media);
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
     * @method getContentStreamById
     * @param {string} id
     * @param {Function} cb
     */
    MediaService.prototype.getContentStreamById = function(id, cb) {
        var self = this;
        var tasks = [
            function(callback) { self.siteQueryService.loadById(id, MediaService.COLL, callback); },
            function(media, callback) {
                if (!media) {
                    return callback(null, null);
                }
                self.provider.getStream(media.location, function(err, stream) {
                    callback(err, stream ? {
                        stream: stream,
                        mime: pb.RequestHandler.getMimeFromPath(this.req.url)
                    } : null);
                });
            }
        ];
        async.waterfall(tasks, cb);
    };

    /**
     *
     * @method setContent
     * @param {String|Buffer} fileDataStrOrBuff
     * @param {String} fileName
     * @param {Function} cb
     */
    MediaService.prototype.setContent = function(fileDataStrOrBuff, fileName, cb) {
        var mediaPath = pb.MediaServiceV2.generateMediaPath(fileName);
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
        var mediaPath = pb.MediaServiceV2.generateMediaPath(fileName);
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
        var mediaPath = pb.MediaServiceV2.generateMediaPath(fileName);
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
     * @deprecated
     * @static
     * @method registerRenderer
     * @param {Function|Object} interfaceImplementation A prototype or object that implements the media renderer interface.
     * @return {Boolean} TRUE if the implementation was registered, FALSE if not
     */
    MediaService.registerRenderer = function(interfaceImplementation) {
        pb.log.warn('MediaService: registerRenderer is deprecated. Use MediaServiceV2.registerRenderer');
        return pb.MediaServiceV2.registerRenderer(interfaceImplementation);
    };

    /**
     * Indicates if a media renderer is already registered
     * @deprecated
     * @static
     * @method isRegistered
     * @param {Function|Object} interfaceImplementation A prototype or object that implements the media renderer interface
     * @return {Boolean} TRUE if registered, FALSE if not
     */
    MediaService.isRegistered = function(interfaceImplementation) {
        pb.log.warn('MediaService: isRegistered is deprecated. Use MediaServiceV2.isRegistered');
        return pb.MediaServiceV2.isRegistered(interfaceImplementation);
    };

    /**
     * Unregisters a media renderer
     * @deprecated
     * @static
     * @method unregisterRenderer
     * @param {Function|Object} interfaceToUnregister A prototype or object that implements the media renderer interface
     * @return {Boolean} TRUE if unregistered, FALSE if not
     */
    MediaService.unregisterRenderer = function(interfaceToUnregister) {
        pb.log.warn('MediaService: unregisterRenderer is deprecated. Use MediaServiceV2.unregisterRenderer');
        return pb.MediaServiceV2.unregisterRenderer(interfaceToUnregister);
    };

    /**
     * Determines if the media URI is a file.  It is determined to be a file if and
     * only if the URI does not begin with "http" or "//".
     * @deprecated
     * @static
     * @method isFile
     * @param {String} mediaUrl A URI string that points to a media resource
     */
    MediaService.isFile = function(mediaUrl) {
        pb.log.warn('MediaService: isFile is deprecated. Use MediaServiceV2.isFile instead');
        return mediaUrl.indexOf('http') !== 0 && mediaUrl.indexOf('//') !== 0;
    };

    /**
     * Generates a media descriptor for a given media URL
     * @method getMediaDescriptor
     * @param {String} mediaUrl
     * @param {Function} cb A callback with two parameters. First, an Error if
     * occurred and second is an object that describes the media resource described
     * by the given media URL
     */
    MediaService.prototype.getMediaDescriptor = function(mediaUrl, cb) {

        //get the type
        var isFile = mediaUrl.indexOf('http') !== 0 && mediaUrl.indexOf('//') !== 0;
        var result = pb.MediaServiceV2.getRenderer(mediaUrl, isFile);
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
     * @param {boolean} [options.isFile=false]
     * @param {Function} cb A callback that provides two parameters.  An Error if
     * exists and the rendered HTML content for the media resource.
     */
    MediaService.prototype.renderByLocation = function(options, cb) {
        var result = options.type ? pb.MediaServiceV2.getRendererByType(options.type) : pb.MediaServiceV2.getRenderer(options.location, options.isFile);
        if (!result) {
            var failures = [ BaseObjectService.validationFailure('type', 'An invalid type was provided') ];
            var err = BaseObjectService.validationError(failures);
            return cb(err, null);
        }

        //set style properties if we can
        if (options.view) {
            options.style = pb.MediaServiceV2.getStyleForView(result.renderer, options.view, options.style);
        }

        result.renderer.render(options, options, cb);
    };

    /**
     * Renders a media resource by ID where ID refers the to the media descriptor
     * id.
     * @method renderById
     * @param {String} id The media resource ID
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
            if (util.isError(err) || !media) {
                return cb(err, null);
            }

            //render
            self.render(media, options, cb);
        });
    };

    /**
     * Renders the media represented by the provided media flag
     * @method render
     * @param {String|Object} flag The media resource ID
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
            flag = pb.MediaServiceV2.parseMediaFlag(flag);
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
        var result = pb.MediaServiceV2.getRendererByType(media.media_type);
        if (!result) {
            return cb(null, null);
        }

        //set style properties if we can
        if (options.view) {
            options.style = pb.MediaServiceV2.getStyleForView(result.renderer, options.view, options.style);
        }

        //render media
        result.renderer.render(media, options, cb);
    };

    /**
     * Retrieves the base style for the given renderer and view.  Overrides will be
     * applied on top of the base style.
     * @deprecated
     * @static
     * @method getStyleForView
     * @param {MediaRenderer} renderer An implementation of MediaRenderer
     * @param {String} view The view to retrieve the default styling for (view,
     * editor, post)
     * @param {Object} [overrides] A hash of style properties that will be applied
     * to the base style for the given view
     */
    MediaService.getStyleForView = function(renderer, view, overrides) {
        pb.log.warn('MediaService: getStyleForView is deprecated. Use MediaServiceV2.getStyleForView');
        return pb.MediaServiceV2.getStyleForView(renderer, view, overrides);
    };

    /**
     * Retrieves a media renderer for the specified type
     * @deprecated
     * @static
     * @method getRendererByType
     * @param {String} type The media type
     * @return {MediaRenderer} A media renderer interface implementation or NULL if
     * none support the given type.
     */
    MediaService.getRendererByType = function(type) {
        pb.log.warn('MediaService: getRendererByType is deprecated. Use MediaServiceV2.getRendererByType');
        return pb.MediaServiceV2.getRendererByType(type);
    };

    /**
     * Retrieves a media renderer for the specified URL
     * @deprecated
     * @static
     * @method getRendererByType
     * @param {String} mediaUrl The media URL
     * @param {Boolean} isFile TRUE if the URL represents an uploaded file, FALSE if not
     * @return {MediaRenderer} A media renderer interface implementation or NULL if
     * none support the given URL.
     */
    MediaService.getRenderer = function(mediaUrl, isFile) {
        pb.log.warn('MediaService: getRenderer is deprecated.  Use MediaServiceV2.getRenderer');
        return pb.MediaServiceV2.getRenderer(mediaUrl, isFile);
    };

    /**
     * Generates a media placeholder for templating
     * @deprecated
     * @static
     * @method getMediaFlag
     * @param {String} mid The media descriptor ID
     * @param {Object} [options] The list of attributes to be provided to the
     * rendering element.
     * @return {String}
     */
    MediaService.getMediaFlag = function(mid, options) {
        pb.log.warn('MediaService: getMediaFlag is deprecated.  Use MediaServiceV2.getMediaFlag');
        return pb.MediaServiceV2.getMediaFlag(mid, options);
    };

    /**
     * Given a content string the function will search for and extract the first
     * occurrence of a media flag. The parsed value that is returned will include:
     * <ul>
     * <li>startIndex - The index where the flag was found to start</li>
     * <li>endIndex - The position in the content string of the last character of the media flag</li>
     * <li>flag - The entire media flag including the start and end markers</li>
     * <li>id - The media descriptor id that is referenced by the media flag</li>
     * <li>style - A hash of the style properties declared for the flag</li>
     * <li>cleanFlag - The media flag stripped of the start and end markers</li>
     * </ul>
     * @deprecated
     * @static
     * @method extractNextMediaFlag
     * @param {String} content The content string that potentially contains 1 or more media flags
     * @return {Object} An object that contains the information about the parsed media flag.
     */
    MediaService.extractNextMediaFlag = function(content) {
        pb.log.warn('MediaService: extractNextMediaFlag is deprecated.  Use MediaServiceV2.extractNextMediaFlag');
        return pb.MediaServiceV2.extractNextMediaFlag(content);
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
        pb.log.warn('MediaService: parseMediaFlag is deprecated. Use MediaServiceV2.parseMediaFlag');
        return pb.MediaServiceV2.parseMediaFlag(flag);
    };

    /**
     * The default editor implementations all for three position values to declared
     * for embeded media (none, left, right, center).  These values map to HTML
     * alignments.  This function retrieves the HTML style attribute for the
     * provided position.
     * @deprecated
     * @static
     * @method getStyleForPosition
     * @param {String} position Can be one of 4 values: none, left, right, center
     * @return {String} The HTML formatted style attribute(s)
     */
    MediaService.getStyleForPosition = function(position) {
        pb.log.warn('MediaService: getStyleForPosition is deprecated. Use MediaServiceV2.getStyleForPosition');
        return pb.MediaServiceV2.getStyleForPosition(position);
    };

    /**
     * Generates the path to uploaded media
     * @deprecated
     * @static
     * @method generateMediaPath
     * @param {String} originalFilename
     * @return {String}
     */
    MediaService.generateMediaPath = function(originalFilename) {
        pb.log.warn('MediaService: generateMediaPath is deprecated. Use MediaServiceV2.generateMediaPath');
        return pb.MediaServiceV2.generateMediaPath(originalFilename);
    };

    /**
     * Generates a filename for a new media object
     * @deprecated
     * @static
     * @method generateFilename
     * @param {String} originalFilename
     * @return {String}
     */
    MediaService.generateFilename = function(originalFilename){
        pb.log.warn('MediaService: generateFilename is deprecated. Use MediaServiceV2.generateFilename');
        return pb.MediaServiceV2.generateFilename(originalFilename);
    };

    /**
     * Retrieves the font awesome icon for the media type.
     * @deprecated
     * @static
     * @method getMediaIcon
     * @param {String} mediaType
     * @return {String}
     */
    MediaService.getMediaIcon = function(mediaType) {
        pb.log.warn('MediaService: getMediaIcon is deprecated. Use MediaServiceV2.getMediaIcon');
        return pb.MediaServiceV2.getMediaIcon(mediaType);
    };

    /**
     * Sets the proper icon and link for an array of media items
     * @deprecated
     * @static
     * @method formatMedia
     * @param {Array} media The array of media objects to format
     * @return {Array} The same array of media that was passed in
     */
    MediaService.formatMedia = function(media) {
        pb.log.warn('MediaService: formatMedia is deprecated. Use MediaServiceV2.formatMedia');
        return pb.MediaServiceV2.formatMedia(media);
    };

    /**
     * Provides a mechanism to retrieve all of the supported extension types
     * that can be uploaded into the system.
     * @deprecated
     * @static
     * @method getSupportedExtensions
     * @return {Array} provides an array of strings
     */
    MediaService.getSupportedExtensions = function() {
        pb.log.warn('MediaService: getSupportedExtensions is deprecated. Use MediaServiceV2.getSupportedExtensions');
        return pb.MediaServiceV2.getSupportedExtensions();
    };

    /**
     * @deprecated
     * @static
     * @method loadMediaProvider
     * @param {Object} context
     * @param {String} context.site
     * @return {MediaProvider} An instance of a media provider or NULL when no
     * provider can be loaded.
     */
    MediaService.loadMediaProvider = function(context) {
        pb.log.warn('MediaService: loadMediaProvider is deprecated. Use MediaServiceV2.loadMediaProvider');
        return pb.MediaServiceV2.loadMediaProvider(context);
    };

    /**
     * Looks up the prototype for the media provider based on the configuration
     * @deprecated
     * @static
     * @method findProviderType
     * @return {MediaProvider}
     */
    MediaService.findProviderType = function() {
        pb.log.warn('MediaService: findProviderType is deprecated. Use MediaServiceV2.findProviderType');
        return pb.MediaServiceV2.findProviderType();
    };

    //exports
    return MediaService;
};
