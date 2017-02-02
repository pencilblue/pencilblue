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
const _ = require('lodash');
const ArrayUtils = require('../../../../lib/utils/array_utils');
const async = require('async');
const BaseObjectService = require('../../base_object_service');
const Configuration = require('../../../config');
const DAO = require('../../../dao/dao');
const fs = require('fs');
const FsMediaProvider = require('../../media/fs_media_provider');
const log = require('../../../utils/logging').newInstance('MediaServiceV2');
const mime = require('mime');
const MongoMediaProvider = require('../../media/mongo_media_provider');
const path = require('path');
const TaskUtils = require('../../../../lib/utils/taskUtils');
const TopicService = require('../topic_service');
const UrlUtils = require('../../../../lib/utils/urlUtils');
const uuid = require('uuid');
const ValidationService = require('../../../validation/validation_service');

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
    class MediaServiceV2 extends BaseObjectService {
        constructor(context) {

            /**
             * @property topicService
             * @type {TopicService}
             */
            this.topicService = new TopicService(Object.assign({}, context));

            /**
             * @property provider
             * @type {MediaProvider}
             */
            this.provider = context.provider || MediaServiceV2.loadMediaProvider(context);

            context.type = MediaServiceV2.TYPE;
            super(context);
        }

        /**
         * @readonly
         * @type {String}
         */
        static get TYPE() {
            return 'media';
        }

        /**
         * @private
         * @static
         * @property MEDIA_PROVIDERS
         * @type {Object}
         */
        static get MEDIA_PROVIDERS() {
            return Object.freeze({
                fs: FsMediaProvider,
                mongo: MongoMediaProvider
            });
        }

        /**
         * Contains the list of media renderers
         * @private
         * @static
         * @property REGISTERED_MEDIA_RENDERERS
         * @type {Array}
         */
        static get REGISTERED_MEDIA_RENDERERS() {
            return registeredMediaRenderers;
        }

        /**
         *
         * @method getContentStreamByPath
         * @param {String} mediaPath
         * @param {Function} cb
         */
        getContentStreamByPath(mediaPath, cb) {
            this.provider.getStream(mediaPath, cb);
        }

        /**
         * @method getContentStreamById
         * @param {string} id
         * @param {Function} cb
         */
        getContentStreamById(id, cb) {
            var self = this;
            var tasks = [
                function (callback) {
                    self.dao.loadById(id, MediaServiceV2.TYPE, callback);
                },
                function (media, callback) {
                    if (!media) {
                        return callback(null, null);
                    }
                    self.provider.getStream(media.location, function (err, stream) {
                        callback(err, stream ? {
                            stream: stream,
                            mime: media.mime || mime.lookup(media.location)
                        } : null);
                    });
                }
            ];
            async.waterfall(tasks, cb);
        }

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
        renderByLocation(options, cb) {
            var result = options.type ? MediaServiceV2.getRendererByType(options.type) : MediaServiceV2.getRenderer(options.location, options.isFile);
            if (!result) {
                var failures = [BaseObjectService.validationFailure('type', 'An invalid type was provided')];
                var err = BaseObjectService.validationError(failures);
                return cb(err, null);
            }

            //set style properties if we can
            if (options.view) {
                options.style = MediaServiceV2.getStyleForView(result.renderer, options.view, options.style);
            }

            result.renderer.render(options, options, cb);
        }

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
        renderById(id, options, cb) {
            var self = this;

            this.dao.loadById(id, MediaServiceV2.TYPE, function (err, media) {
                if (_.isError(err) || !media) {
                    return cb(err, null);
                }

                //render
                self.render(media, options, cb);
            });
        }

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
        render(media, options, cb) {
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
        }

        /**
         *
         * @method validate
         * @param {Object} context
         * @param {Object} context.data The DTO that was provided for persistence
         * @param {MediaServiceV2} context.service An instance of the service that triggered
         * the event that called this handler
         * @param {Function} cb A callback that takes a single parameter: an error if occurred
         */
        validate(context, cb) {
            var obj = context.data;
            var errors = context.validationErrors;

            //ensure we have a request body
            if (!_.isObject(obj)) {
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
                TaskUtils.wrapTask(this, this.validateName, [context]),
                TaskUtils.wrapTask(this, this.validateTopicReferences, [context])
            ];
            async.series(tasks, cb);
        }

        /**
         * Validates any references to topic objects in the data object passed through the context.
         * @method validateTopicReferences
         * @param {object} context
         * @param {object} context.data
         * @param {Array} context.data.media_topics
         * @param {Array} context.validationErrors
         * @param {function} cb (Error)
         */
        validateTopicReferences(context, cb) {
            var obj = context.data;
            var errors = context.validationErrors;

            if (!Array.isArray(obj.media_topics)) {
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
            this.topicService.getAll(opts, function (err, topics) {
                if (_.isError(err)) {
                    return cb(err);
                }

                //convert to map
                var map = ArrayUtils.toObject(topics, function (topic) {
                    return topic.id.toString();
                });

                //find the ones that don't exist
                obj.media_topics.forEach(function (item, index) {
                    if (!map[item]) {
                        errors.push(BaseObjectService.validationFailure('media_topics[' + index + ']', item + ' is not a valid reference'));
                    }
                });

                cb();
            });
        }

        /**
         * @method validateName
         * @param {object} context
         * @param {object} context.data
         * @param {string} context.data.name
         * @param {Array} context.validationErrors
         * @param {function} cb (Error)
         */
        validateName(context, cb) {
            var obj = context.data;
            var errors = context.validationErrors;

            if (!ValidationService.isNonEmptyStr(obj.name, true)) {
                errors.push(BaseObjectService.validationFailure('name', 'The name cannot be empty'));
                return cb();
            }

            //ensure the media name is unique
            var where = {name: obj.name};
            this.dao.unique(MediaServiceV2.TYPE, where, obj[DAO.getIdField()], function (err, isUnique) {
                if (_.isError(err)) {
                    return cb(err);
                }
                else if (!isUnique) {
                    errors.push(BaseObjectService.validationFailure('name', 'The name ' + obj.name + ' is already in use'));
                }
                cb();
            });
        }

        /**
         * Persists the uploaded media content to the provider
         * @method persistContent
         * @param {object} context
         * @param {object} context.data
         * @param {File} context.data.content Formidable file descriptor
         * @param {function} cb (Error)
         */
        persistContent(context, cb) {
            var obj = context.data;
            var fileDescriptor = obj.content;

            //delete file reference before persistence
            delete obj.content;

            //generate a random media ID
            var stream = fs.createReadStream(fileDescriptor.path);
            this.provider.setStream(stream, obj.location, cb);
        }

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
        static onFormat(context, cb) {
            var dto = context.data;
            dto.name = BaseObjectService.sanitize(dto.name);
            dto.caption = BaseObjectService.sanitize(dto.caption);

            //when media topics are presented as a string then delimit them and convert to an array
            if (ValidationService.isNonEmptyStr(dto.media_topics, true)) {
                dto.media_topics = dto.media_topics.split(',');
            }
            else if (_.isNil(dto.media_topics) || dto.media_topics === '') {
                dto.media_topics = [];
            }
            cb(null);
        }

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
        static onMerge(context, cb) {
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
            if ((obj.isFile = _.isObject(dto.content))) {

                //ensure the content is available for validation
                obj.content = dto.content;
                obj.meta = obj.meta || {};
                obj.meta.mime = obj.content.type;
                obj.meta.fileName = obj.content.name;
                obj.meta.fileSize = obj.content.size;
                mediaUrl = MediaServiceV2.generateMediaPath(obj.content.name);
            }
            else if (_.isString(dto.content)) {
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

                meta: function (callback) {
                    renderer.getMeta(mediaUrl, obj.isFile, callback);
                },

                thumbnail: function (callback) {
                    renderer.getThumbnail(mediaUrl, callback);
                },

                mediaId: function (callback) {
                    renderer.getMediaId(mediaUrl, callback);
                }
            };
            async.series(tasks, function (err, taskResult) {
                obj.media_type = result.type;
                if (taskResult) {
                    obj.icon = renderer.getIcon(result.type);
                    obj.thumbnail = taskResult.thumbnail;
                    obj.location = taskResult.mediaId;
                    Object.assign(obj.meta, taskResult.meta);
                }
                cb(err);
            });
        }

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
        static onValidate(context, cb) {
            context.service.validate(context, cb);
        }

        /**
         * @static
         * @method onBeforeSave
         * @param {object} context
         * @param {object} context.data The media descriptor object
         * @param {MediaServiceV2} context.service
         * @param {function} cb (Error)
         */
        static onBeforeSave(context, cb) {
            var obj = context.data;
            if (obj.content) {
                return context.service.persistContent(context, cb);
            }
            cb();
        }

        /**
         * Retrieves a media renderer for the specified URL
         * @static
         * @method getRendererByType
         * @param {String} mediaUrl The media URL
         * @param {Boolean} [isFile=false] TRUE if the URL represents an uploaded file, FALSE if not
         * @return {object|null} A media renderer interface implementation or NULL if
         * none support the given URL.
         */
        static getRenderer(mediaUrl, isFile) {
            if (typeof isFile === 'undefined') {
                isFile = MediaServiceV2.isFile(mediaUrl);
            }

            for (var i = 0; i < MediaServiceV2.REGISTERED_MEDIA_RENDERERS.length; i++) {

                var t = MediaServiceV2.REGISTERED_MEDIA_RENDERERS[i].getType(mediaUrl, isFile);
                if (t !== null) {

                    log.silly('MediaService: Selected media renderer [%s] for URI [%s]', MediaServiceV2.REGISTERED_MEDIA_RENDERERS[i].getName(), mediaUrl);
                    return {
                        type: t,
                        renderer: MediaServiceV2.REGISTERED_MEDIA_RENDERERS[i]
                    };
                }
            }

            log.warn('MediaServiceV2: Failed to select media renderer URI [%s]', mediaUrl);
            return null;
        }

        /**
         * Retrieves a media renderer for the specified type
         * @static
         * @method getRendererByType
         * @param {String} type The media type
         * @return {object|null} A media renderer interface implementation or NULL if
         * none support the given type.
         */
        static getRendererByType(type) {
            for (var i = 0; i < MediaServiceV2.REGISTERED_MEDIA_RENDERERS.length; i++) {

                var types = MediaServiceV2.REGISTERED_MEDIA_RENDERERS[i].getSupportedTypes();
                if (types && types[type]) {

                    log.silly('MediaService: Selected media renderer [%s] for type [%s]', MediaServiceV2.REGISTERED_MEDIA_RENDERERS[i].getName(), type);
                    return {
                        type: type,
                        renderer: MediaServiceV2.REGISTERED_MEDIA_RENDERERS[i]
                    };
                }
            }

            log.warn('MediaServiceV2: Failed to select media renderer type [%s]', type);
            return null;
        }

        /**
         * Generates a media placeholder for templating
         * @static
         * @method getMediaFlag
         * @param {String} mid The media descriptor ID
         * @param {Object} [options] The list of attributes to be provided to the
         * rendering element.
         * @return {String}
         */
        static getMediaFlag(mid, options) {
            if (!mid) {
                throw new Error('The media id is required but [' + mid + '] was provided');
            }
            else if (!_.isObject(options)) {
                options = {};
            }

            var flag = '^media_display_' + mid + '/';

            var cnt = 0;
            Object.keys(options).forEach(function (opt) {
                if (cnt++ > 0) {
                    flag += ',';
                }
                flag += opt + ':' + options[opt];
            });
            flag += '^';
            return flag;
        }

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
        static extractNextMediaFlag(content) {
            if (!_.isString(content)) {
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

            var flag = content.substring(startIndex, endIndex + 1);
            var result = MediaServiceV2.parseMediaFlag(flag);
            if (result) {
                result.startIndex = startIndex;
                result.endIndex = endIndex;
                result.flag = flag;
            }
            return result;
        }

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
        static parseMediaFlag(flag) {
            if (!_.isString(flag)) {
                return null;
            }

            //strip flag start and end markers if exist
            var hasStartMarker = flag.charAt(0) === '^';
            var hasEndMarker = flag.charAt(flag.length - 1) === '^';
            flag = flag.substring(hasStartMarker ? 1 : 0, hasEndMarker ? flag.length - 1 : undefined);

            //split on forward slash as it is the division between id and style
            var prefix = 'media_display_';
            var parts = flag.split('/');
            var id = parts[0].substring(prefix.length);

            var style = {};
            if (parts[1] && parts[1].length) {
                parts[1].split(',').forEach(function (item) {
                    var division = item.split(':');
                    style[division[0]] = division[1];
                });
            }

            return {
                id: id,
                style: style,
                cleanFlag: flag
            };
        }

        /**
         * Provides a mechanism to retrieve all of the supported extension types
         * that can be uploaded into the system.
         * @static
         * @method getSupportedExtensions
         * @return {Array} provides an array of strings
         */
        static getSupportedExtensions() {

            var extensions = {};
            MediaServiceV2.REGISTERED_MEDIA_RENDERERS.forEach(function (provider) {

                //for backward compatibility check for existence of extension retrieval
                if (!_.isFunction(provider.getSupportedExtensions)) {
                    log.warn('MediaServiceV2: Renderer %s does provide an implementation for getSupportedExtensions', provider.getName());
                    return;
                }

                //retrieve the extensions
                var exts = provider.getSupportedExtensions();
                if (!Array.isArray(exts)) {
                    return;
                }

                //add them to the hash
                exts.forEach(function (extension) {
                    extensions[extension] = true;
                });
            });

            return Object.keys(extensions);
        }

        /**
         * Registers a media renderer
         * @static
         * @method registerRenderer
         * @param {Function|Object} interfaceImplementation A prototype or object that implements the media renderer interface.
         * @return {Boolean} TRUE if the implementation was registered, FALSE if not
         */
        static registerRenderer(interfaceImplementation) {
            if (!interfaceImplementation) {
                return false;
            }

            MediaServiceV2.REGISTERED_MEDIA_RENDERERS.push(interfaceImplementation);
            return true;
        }

        /**
         * Indicates if a media renderer is already registered
         * @static
         * @method isRegistered
         * @param {Function|Object} interfaceImplementation A prototype or object that implements the media renderer interface
         * @return {Boolean} TRUE if registered, FALSE if not
         */
        static isRegistered(interfaceImplementation) {
            return MediaServiceV2.REGISTERED_MEDIA_RENDERERS.indexOf(interfaceImplementation) >= 0;
        }

        /**
         * Unregisters a media renderer
         * @static
         * @method unregisterRenderer
         * @param {Function|Object} interfaceToUnregister A prototype or object that implements the media renderer interface
         * @return {Boolean} TRUE if unregistered, FALSE if not
         */
        static unregisterRenderer(interfaceToUnregister) {
            var index = MediaServiceV2.REGISTERED_MEDIA_RENDERERS.indexOf(interfaceToUnregister);
            if (index >= 0) {
                MediaServiceV2.REGISTERED_MEDIA_RENDERERS.splice(index, 1);
                return true;
            }
            return false;
        }

        /**
         *
         * @static
         * @method loadMediaProvider
         * @param {Object} context
         * @param {String} context.site
         * @return {MediaProvider} An instance of a media provider or NULL when no
         * provider can be loaded.
         */
        static loadMediaProvider(context) {
            var ProviderType = MediaServiceV2.MEDIA_PROVIDERS[Configuration.active.media.provider];
            if (_.isNil(ProviderType)) {
                ProviderType = MediaServiceV2.findProviderType();
            }
            return !!ProviderType ? new ProviderType(context) : null;
        }

        /**
         * Looks up the prototype for the media provider based on the configuration
         * @static
         * @method findProviderType
         * @return {MediaProvider}
         */
        static findProviderType() {
            var paths = [path.join(Configuration.active.docRoot, Configuration.active.media.provider), Configuration.active.media.provider];
            for (var i = 0; i < paths.length; i++) {
                try {
                    return require(paths[i]);
                }
                catch (e) {
                    log.silly(e.stack);
                }
            }
            return null;
        }

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
        static getStyleForPosition(position) {
            var positionToStyle = {
                left: 'float: left;margin-right: 1em',
                right: 'float: right;margin-left: 1em',
                center: 'text-align: center'
            };
            return positionToStyle[position] || '';
        }

        /**
         * Generates the path to uploaded media
         * @static
         * @method generateMediaPath
         * @param {String} originalFilename
         * @return {String}
         */
        static generateMediaPath(originalFilename) {
            var now = new Date();
            var filename = MediaServiceV2.generateFilename(originalFilename);
            return UrlUtils.join('/media', now.getFullYear() + '', (now.getMonth() + 1) + '', filename);
        }

        /**
         * Generates a filename for a new media object
         * @static
         * @method generateFilename
         * @param {String} originalFilename
         * @return {String}
         */
        static generateFilename(originalFilename) {
            var now = new Date();

            //calculate extension
            var ext = '';
            var extIndex = originalFilename.lastIndexOf('.');
            if (extIndex >= 0) {
                ext = originalFilename.substr(extIndex);
            }

            //build file name
            return uuid.v4() + '-' + now.getTime() + ext;
        }

        /**
         * Retrieves the font awesome icon for the media type.
         * @static
         * @method getMediaIcon
         * @param {String} mediaType
         * @return {String}
         */
        static getMediaIcon(mediaType) {

            var result = MediaServiceV2.getRendererByType(mediaType);
            if (!result) {
                return '';
            }
            return result.renderer.getIcon(mediaType);
        }

        /**
         * Sets the proper icon and link for an array of media items
         * @static
         * @method formatMedia
         * @param {Array} media The array of media objects to format
         * @return {Array} The same array of media that was passed in
         */
        static formatMedia(media) {
            var quickLookup = {};
            media.forEach(function (item) {

                //get the renderer
                var renderer = quickLookup[item.media_type];
                if (!renderer) {
                    var result = MediaServiceV2.getRendererByType(item.media_type);
                    if (!result) {
                        log.warn('MediaService: Media item [%s] contains an unsupported media type.', media[DAO.getIdField()]);
                    }
                    else {
                        quickLookup[item.media_type] = renderer = result.renderer;
                    }
                }

                item.icon = renderer ? renderer.getIcon(item.media_type) : 'question';
                item.link = renderer ? renderer.getNativeUrl(item) : '#';
            });
            return media;
        }

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
        static getStyleForView(renderer, view, overrides) {
            if (!overrides) {
                overrides = {};
            }

            var base = renderer.getStyle(view);
            var clone = _.clone(base);
            Object.assign(clone, overrides);
            return clone;
        }

        /**
         * Determines if the media URI is a file.  It is determined to be a file if and
         * only if the URI does not begin with "http" or "//".
         * @static
         * @method isFile
         * @param {String} mediaUrl A URI string that points to a media resource
         */
        static isFile(mediaUrl) {
            return !(mediaUrl.indexOf('http') === 0 || mediaUrl.indexOf('//') === 0);
        }
    }

    var registeredMediaRenderers = [
        require(path.join(Configuration.active.docRoot, '/include/service/media/renderers/image_media_renderer.js')),
        require(path.join(Configuration.active.docRoot, '/include/service/media/renderers/video_media_renderer.js')),
        require(path.join(Configuration.active.docRoot, '/include/service/media/renderers/youtube_media_renderer.js')),
        require(path.join(Configuration.active.docRoot, '/include/service/media/renderers/daily_motion_media_renderer.js')),
        require(path.join(Configuration.active.docRoot, '/include/service/media/renderers/vimeo_media_renderer.js')),
        require(path.join(Configuration.active.docRoot, '/include/service/media/renderers/vine_media_renderer.js')),
        require(path.join(Configuration.active.docRoot, '/include/service/media/renderers/instagram_media_renderer.js')),
        require(path.join(Configuration.active.docRoot, '/include/service/media/renderers/slideshare_media_renderer.js')),
        require(path.join(Configuration.active.docRoot, '/include/service/media/renderers/trinket_media_renderer.js')),
        require(path.join(Configuration.active.docRoot, '/include/service/media/renderers/storify_media_renderer.js')),
        require(path.join(Configuration.active.docRoot, '/include/service/media/renderers/kickstarter_media_renderer.js')),
        require(path.join(Configuration.active.docRoot, '/include/service/media/renderers/pdf_media_renderer.js'))
    ];

    //Event Registries
    BaseObjectService.on(MediaServiceV2.TYPE + '.' + BaseObjectService.FORMAT, MediaServiceV2.onFormat);
    BaseObjectService.on(MediaServiceV2.TYPE + '.' + BaseObjectService.MERGE, MediaServiceV2.onMerge);
    BaseObjectService.on(MediaServiceV2.TYPE + '.' + BaseObjectService.VALIDATE, MediaServiceV2.onValidate);
    BaseObjectService.on(MediaServiceV2.TYPE + '.' + BaseObjectService.BEFORE_SAVE, MediaServiceV2.onBeforeSave);

    //exports
    module.exports = MediaServiceV2;
