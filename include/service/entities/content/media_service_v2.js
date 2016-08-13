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
'use strict';

//dependencies
var util  = require('../../../util.js');
var async = require('async');
var path = require('path');
var fs = require('fs');

module.exports = function(pb) {

    //pb dependencies
    var DAO = pb.DAO;
    var BaseObjectService = pb.BaseObjectService;
    var ValidationService = pb.ValidationService;

    /**
     * Provides functions to interact with media objects.  This also includes interacting with the media contents
     *
     * @class MediaServiceV2
     * @constructor
     * @extends BaseObjectService
     * @param {Object} context
     * @param {string} context.site
     * @param {boolean} context.onlyThisSite
     * @param {MediaProvider} [context.provider]
     */
    function MediaServiceV2(context) {

        /**
         * @property topicService
         * @type {TopicService}
         */
        this.topicService = new pb.TopicService(util.merge(context, {}));

        /**
         * @property provider
         * @type {MediaProvider}
         */
        this.provider = context.provider || MediaServiceV2.loadMediaProvider(context);

        context.type = TYPE;
        MediaServiceV2.super_.call(this, context);
    }
    util.inherits(MediaServiceV2, BaseObjectService);

    /**
     *
     * @private
     * @static
     * @readonly
     * @property TYPE
     * @type {String}
     */
    var TYPE = 'media';

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
     *
     * @method getContentStreamByPath
     * @param {String} mediaPath
     * @param {Function} cb
     */
    MediaServiceV2.prototype.getContentStreamByPath = function(mediaPath, cb) {
        this.provider.getStream(mediaPath, cb);
    };

    /**
     * @method getContentStreamById
     * @param {string} id
     * @param {Function} cb
     */
    MediaServiceV2.prototype.getContentStreamById = function(id, cb) {
        var self = this;
        var tasks = [
            function(callback) { self.dao.loadById(id, TYPE, callback); },
            function(media, callback) {
                if (!media) {
                    return callback(null, null);
                }
                self.provider.getStream(media.location, function(err, stream) {
                    callback(err, stream ? {
                        stream: stream,
                        mime: media.mime || pb.RequestHandler.getMimeFromPath(media.location)
                    } : null);
                });
            }
        ];
        async.waterfall(tasks, cb);
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
    MediaServiceV2.prototype.renderByLocation = function(options, cb) {
        var result = options.type ? MediaServiceV2.getRendererByType(options.type) : MediaServiceV2.getRenderer(options.location, options.isFile);
        if (!result) {
            var failures = [ BaseObjectService.validationFailure('type', 'An invalid type was provided') ];
            var err = BaseObjectService.validationError(failures);
            return cb(err, null);
        }

        //set style properties if we can
        if (options.view) {
            options.style = MediaServiceV2.getStyleForView(result.renderer, options.view, options.style);
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
    MediaServiceV2.prototype.renderById = function(id, options, cb) {
        var self = this;

        this.dao.loadById(id, TYPE, function (err, media) {
            if (util.isError(err) || !media) {
                return cb(err, null);
            }

            //render
            self.render(media, options, cb);
        });
    };

    /**
     * Renders the media represented by the provided media descriptor.
     * @method render
     * @param {object} media The media resource ID
     * @param {string} media.media_type
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
    MediaServiceV2.prototype.render = function(media, options, cb) {
        //retrieve renderer
        var result = MediaServiceV2.getRendererByType(media.media_type);
        if (!result) {
            return cb(null, null);
        }

        //set style properties if we can
        if (options.view) {
            options.style = MediaServiceV2.getStyleForView(result.renderer, options.view, options.style);
        }

        //render media
        result.renderer.render(media, options, cb);
    };

    /**
     *
     * @method validate
     * @param {Object} context
     * @param {Object} context.data The DTO that was provided for persistence
     * @param {MediaServiceV2} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    MediaServiceV2.prototype.validate = function(context, cb) {
        var obj = context.data;
        var errors = context.validationErrors;

        //ensure we have a request body
        if (!util.isObject(obj)) {
            errors.push(BaseObjectService.validationFailure('', 'The descriptor must be an object'));
            return cb(null, errors);
        }

        //validate that we have a type
        if (!obj.media_type) {
            //lack of a media type indicates that the content was bad
            errors.push(BaseObjectService.validationFailure('content', 'Invalid content was provided'));
        }

        //validate the caption
        if (!ValidationService.isStr(obj.caption, false)) {
            errors.push(BaseObjectService.validationFailure('caption', 'Caption must be a valid string'));
        }

        //validate other stuff
        var tasks = [
            util.wrapTask(this, this.validateName, [context]),
            util.wrapTask(this, this.validateTopicReferences, [context])
        ];
        async.series(tasks, cb);
    };

    /**
     * Validates any references to topic objects in the data object passed through the context.
     * @method validateTopicReferences
     * @param {object} context
     * @param {object} context.data
     * @param {Array} context.data.media_topics
     * @param {Array} context.validationErrors
     * @param {function} cb (Error)
     */
    MediaServiceV2.prototype.validateTopicReferences = function(context, cb) {
        var obj = context.data;
        var errors = context.validationErrors;

        if (!util.isArray(obj.media_topics)) {
            errors.push(BaseObjectService.validationFailure('media_topics', 'A valid array of topic IDs must be provided'));
            return cb();
        }

        //don't bother check the DB is the array is empty.
        if (obj.media_topics.length === 0) {
            return cb();
        }

        //verify that each topic exists
        var opts = {
            select: {name: 1},
            where: DAO.getIdInWhere(obj.media_topics)
        };
        this.topicService.getAll(opts, function(err, topics) {
            if (util.isError(err)) {
                return cb(err);
            }

            //convert to map
            var map = util.arrayToObj(topics, function(topics, i) {
                return topics[i].id.toString();
            });

            //find the ones that don't exist
            obj.media_topics.forEach(function(item, index) {
                if (!map[item]) {
                    errors.push(BaseObjectService.validationFailure('media_topics[' + index + ']', item + ' is not a valid reference'));
                }
            });

            cb();
        });
    };

    /**
     * @method validateName
     * @param {object} context
     * @param {object} context.data
     * @param {string} context.data.name
     * @param {Array} context.validationErrors
     * @param {function} cb (Error)
     */
    MediaServiceV2.prototype.validateName = function(context, cb) {
        var obj = context.data;
        var errors = context.validationErrors;

        if (!ValidationService.isNonEmptyStr(obj.name, true)) {
            errors.push(BaseObjectService.validationFailure('name', 'The name cannot be empty'));
            return cb();
        }

        //ensure the media name is unique
        var where = { name: obj.name };
        this.dao.unique(TYPE, where, obj[DAO.getIdField()], function(err, isUnique) {
            if(util.isError(err)) {
                return cb(err);
            }
            else if(!isUnique) {
                errors.push(BaseObjectService.validationFailure('name', 'The name ' + obj.name + ' is already in use'));
            }
            cb();
        });
    };

    /**
     * Persists the uploaded media content to the provider
     * @method persistContent
     * @param {object} context
     * @param {object} context.data
     * @param {File} context.data.content Formidable file descriptor
     * @param {function} cb (Error)
     */
    MediaServiceV2.prototype.persistContent = function(context, cb) {
        var obj = context.data;
        var fileDescriptor = obj.content;

        //delete file reference before persistence
        delete obj.content;

        //generate a random media ID
        var stream = fs.createReadStream(fileDescriptor.path);
        this.provider.setStream(stream, obj.location, cb);
    };

    /**
     *
     * @static
     * @method onFormat
     * @param {Object} context
     * @param {object} context.data The incoming request body
     * @param {MediaServiceV2} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    MediaServiceV2.onFormat = function(context, cb) {
        var dto = context.data;
        dto.name = BaseObjectService.sanitize(dto.name);
        dto.caption = BaseObjectService.sanitize(dto.caption);

        //when media topics are presented as a string then delimit them and convert to an array
        if (ValidationService.isNonEmptyStr(dto.media_topics, true)) {
            dto.media_topics = dto.media_topics.split(',');
        }
        else if (util.isNullOrUndefined(dto.media_topics) || dto.media_topics === '') {
            dto.media_topics = [];
        }
        cb(null);
    };

    /**
     *
     * @static
     * @method onMerge
     * @param {Object} context
     * @param {object} context.data The incoming request body
     * @param {object} context.object The object to be persisted
     * @param {MediaServiceV2} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    MediaServiceV2.onMerge = function(context, cb) {
        var dto = context.data;
        var obj = context.object;

        obj.name = dto.name;
        obj.caption = dto.caption;
        obj.media_topics = dto.media_topics;

        if (!dto.content) {
            //no content was sent so we should rely on what is already available
            return cb();
        }

        //check to see if we have a file handle
        var mediaUrl;
        if ( (obj.isFile = util.isObject(dto.content)) ) {

            //ensure the content is available for validation
            obj.content = dto.content;
            obj.meta = obj.meta || {};
            obj.meta.mime = obj.content.type;
            obj.meta.fileName = obj.content.name;
            obj.meta.fileSize = obj.content.size;
            mediaUrl = MediaServiceV2.generateMediaPath(obj.content.name);
        }
        else if (util.isString(dto.content)) {
            //we were given a link, clear out any old refs to a file based media obj
            mediaUrl = dto.content;
            obj.meta = {};
        }

        //determine type
        var result = MediaServiceV2.getRenderer(mediaUrl, obj.isFile);
        if (!result) {
            obj.location = null;
            obj.media_type = null;
            return cb();
        }

        var renderer = result.renderer;
        var tasks = {

            meta: function(callback) {
                renderer.getMeta(mediaUrl, obj.isFile, callback);
            },

            thumbnail: function(callback) {
                renderer.getThumbnail(mediaUrl, callback);
            },

            mediaId: function(callback) {
                renderer.getMediaId(mediaUrl, callback);
            }
        };
        async.series(tasks, function(err, taskResult) {
            obj.media_type = result.type;
            if (taskResult) {
                obj.icon = renderer.getIcon(result.type);
                obj.thumbnail = taskResult.thumbnail;
                obj.location = taskResult.mediaId;
                util.merge(taskResult.meta, obj.meta);
            }
            cb(err);
        });
    };

    /**
     *
     * @static
     * @method onValidate
     * @param {Object} context
     * @param {Object} context.data The DTO that was provided for persistence
     * @param {MediaServiceV2} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    MediaServiceV2.onValidate = function(context, cb) {
        context.service.validate(context, cb);
    };

    /**
     * @static
     * @method onBeforeSave
     * @param {object} context
     * @param {object} context.data The media descriptor object
     * @param {MediaServiceV2} context.service
     * @param {function} cb (Error)
     */
    MediaServiceV2.onBeforeSave = function(context, cb) {
        var obj = context.data;
        if (obj.content) {
            return context.service.persistContent(context, cb);
        }
        cb();
    };

    /**
     * Retrieves a media renderer for the specified URL
     * @static
     * @method getRendererByType
     * @param {String} mediaUrl The media URL
     * @param {Boolean} [isFile=false] TRUE if the URL represents an uploaded file, FALSE if not
     * @return {object|null} A media renderer interface implementation or NULL if
     * none support the given URL.
     */
    MediaServiceV2.getRenderer = function(mediaUrl, isFile) {
        if (typeof isFile === 'undefined') {
            isFile = MediaServiceV2.isFile(mediaUrl);
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

        pb.log.warn('MediaServiceV2: Failed to select media renderer URI [%s]', mediaUrl);
        return null;
    };

    /**
     * Retrieves a media renderer for the specified type
     * @static
     * @method getRendererByType
     * @param {String} type The media type
     * @return {object|null} A media renderer interface implementation or NULL if
     * none support the given type.
     */
    MediaServiceV2.getRendererByType = function(type) {
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

        pb.log.warn('MediaServiceV2: Failed to select media renderer type [%s]', type);
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
    MediaServiceV2.getMediaFlag = function(mid, options) {
        if (!mid) {
            throw new Error('The media id is required but ['+mid+'] was provided');
        }
        else if (!util.isObject(options)) {
            options = {};
        }

        var flag = '^media_display_'+mid+'/';

        var cnt = 0;
        Object.keys(options).forEach(function(opt) {
            if (cnt++ > 0) {
                flag += ',';
            }
            flag += opt + ':' + options[opt];
        });
        flag += '^';
        return flag;
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
     * @static
     * @method extractNextMediaFlag
     * @param {String} content The content string that potentially contains 1 or more media flags
     * @return {Object} An object that contains the information about the parsed media flag.
     */
    MediaServiceV2.extractNextMediaFlag = function(content) {
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
        var result = MediaServiceV2.parseMediaFlag(flag);
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
     * @method parseMediaFlag
     * @param {String} flag The content string that potentially contains 1 or more media flags
     * @return {Object} An object that contains the information about the parsed media flag.
     */
    MediaServiceV2.parseMediaFlag = function(flag) {
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
            parts[1].split(',').forEach(function(item) {
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
     * Provides a mechanism to retrieve all of the supported extension types
     * that can be uploaded into the system.
     * @static
     * @method getSupportedExtensions
     * @return {Array} provides an array of strings
     */
    MediaServiceV2.getSupportedExtensions = function() {

        var extensions = {};
        REGISTERED_MEDIA_RENDERERS.forEach(function(provider) {

            //for backward compatibility check for existence of extension retrieval
            if (!util.isFunction(provider.getSupportedExtensions)) {
                pb.log.warn('MediaServiceV2: Renderer %s does provide an implementation for getSupportedExtensions', provider.getName());
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
     * Registers a media renderer
     * @static
     * @method registerRenderer
     * @param {Function|Object} interfaceImplementation A prototype or object that implements the media renderer interface.
     * @return {Boolean} TRUE if the implementation was registered, FALSE if not
     */
    MediaServiceV2.registerRenderer = function(interfaceImplementation) {
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
    MediaServiceV2.isRegistered = function(interfaceImplementation) {
        return REGISTERED_MEDIA_RENDERERS.indexOf(interfaceImplementation) >= 0;
    };

    /**
     * Unregisters a media renderer
     * @static
     * @method unregisterRenderer
     * @param {Function|Object} interfaceToUnregister A prototype or object that implements the media renderer interface
     * @return {Boolean} TRUE if unregistered, FALSE if not
     */
    MediaServiceV2.unregisterRenderer = function(interfaceToUnregister) {
        var index = REGISTERED_MEDIA_RENDERERS.indexOf(interfaceToUnregister);
        if (index >= 0) {
            REGISTERED_MEDIA_RENDERERS.splice(index, 1);
            return true;
        }
        return false;
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
    MediaServiceV2.loadMediaProvider = function(context) {
        var ProviderType = MEDIA_PROVIDERS[pb.config.media.provider];
        if (util.isNullOrUndefined(ProviderType)) {
            ProviderType = MediaServiceV2.findProviderType();
        }
        return !!ProviderType ? new ProviderType(context) : null;
    };

    /**
     * Looks up the prototype for the media provider based on the configuration
     * @static
     * @method findProviderType
     * @return {MediaProvider}
     */
    MediaServiceV2.findProviderType = function() {
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

    /**
     * The default editor implementations all for three position values to declared
     * for embedded media (none, left, right, center).  These values map to HTML
     * alignments.  This function retrieves the HTML style attribute for the
     * provided position.
     * @static
     * @method getStyleForPosition
     * @param {String} position Can be one of 4 values: none, left, right, center
     * @return {String} The HTML formatted style attribute(s)
     */
    MediaServiceV2.getStyleForPosition = function(position) {
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
    MediaServiceV2.generateMediaPath = function(originalFilename) {
        var now = new Date();
        var filename  = MediaServiceV2.generateFilename(originalFilename);
        return pb.UrlService.urlJoin('/media', now.getFullYear() + '', (now.getMonth() + 1) + '', filename);
    };

    /**
     * Generates a filename for a new media object
     * @static
     * @method generateFilename
     * @param {String} originalFilename
     * @return {String}
     */
    MediaServiceV2.generateFilename = function(originalFilename){
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
    MediaServiceV2.getMediaIcon = function(mediaType) {

        var result = MediaServiceV2.getRendererByType(mediaType);
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
    MediaServiceV2.formatMedia = function(media) {
        var quickLookup = {};
        media.forEach(function(item) {

            //get the renderer
            var renderer = quickLookup[item.media_type];
            if (!renderer) {
                var result = MediaServiceV2.getRendererByType(item.media_type);
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
    MediaServiceV2.getStyleForView = function(renderer, view, overrides) {
        if (!overrides) {
            overrides = {};
        }

        var base = renderer.getStyle(view);
        var clone = util.clone(base);
        util.merge(overrides, clone);
        return clone;
    };

    /**
     * Determines if the media URI is a file.  It is determined to be a file if and
     * only if the URI does not begin with "http" or "//".
     * @static
     * @method isFile
     * @param {String} mediaUrl A URI string that points to a media resource
     */
    MediaServiceV2.isFile = function(mediaUrl) {
        return !(mediaUrl.indexOf('http') === 0 || mediaUrl.indexOf('//') === 0);
    };

    //Event Registries
    BaseObjectService.on(TYPE + '.' + BaseObjectService.FORMAT, MediaServiceV2.onFormat);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.MERGE, MediaServiceV2.onMerge);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.VALIDATE, MediaServiceV2.onValidate);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.BEFORE_SAVE, MediaServiceV2.onBeforeSave);

    //exports
    return MediaServiceV2;
};
