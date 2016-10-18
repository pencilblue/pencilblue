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

module.exports = function(pb) {

    //pb dependencies
    var DAO               = pb.DAO;
    var ContentService    = pb.ContentService;
    var BaseObjectService = pb.BaseObjectService;
    var ValidationService = pb.ValidationService;
    var TopicService      = pb.TopicService;

    /**
     * Provides functions to interact with content such as articles and pages.
     * It abstracts the heavy lifting away from specific implementations.  This
     * prototype must be extended.
     *
     * @class ContentObjectService
     * @extends BaseObjectService
     * @constructor
     * @param {object} context
     * @param {object} [context.contentSettings]
     * @param {string} context.site
     * @param {boolean} context.onlyThisSite
     * @param {string} context.type
     */
    function ContentObjectService(context){
        if (!util.isObject(context)) {
            context = {};
        }

        /**
         *
         * @property contentSettings
         * @type {Object}
         */
        this.contentSettings = context.contentSettings;

        /**
         *
         * @property topicService
         * @type {TopicService}
         */
        this.topicService = new TopicService();

        /**
         * @property site
         * @type {String}
         */
        this.site = context.site;

        //call the super constructor
        ContentObjectService.super_.call(this, context);
    }
    util.inherits(ContentObjectService, BaseObjectService);

    /**
     *
     * @static
     * @readonly
     * @property BEFORE_RENDER
     * @type {String}
     */
    ContentObjectService.BEFORE_RENDER = 'beforeRender';

    /**
     *
     * @static
     * @readonly
     * @property AFTER_RENDER
     * @type {String}
     */
    ContentObjectService.AFTER_RENDER = 'afterRender';

    /**
     *
     * @method getPublished
     * @param {Object} [options]
     * @param {Object} [options.where]
     * @param {Object} [options.select]
     * @param {Array} [options.order]
     * @param {Integer} [options.limit]
     * @param {Integer} [options.offset]
     * @param {Boolean} [options.render]
     * @param {Function} cb
     */
    ContentObjectService.prototype.getPublished = function(options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }

        //ensure a where clause exists
        if (!util.isObject(options.where)) {
            options.where = {};
        }

        //add where clause to weed out drafts
        ContentObjectService.setPublishedClause(options.where);

        this.getAll(options, cb);
    };

    /**
     *
     * @method getDrafts
     * @param {Object} [options]
     * @param {Object} [options.where]
     * @param {Object} [options.select]
     * @param {Array} [options.order]
     * @param {Integer} [options.limit]
     * @param {Integer} [options.offset]
     * @param {Boolean} [options.render=false]
     * @param {Function} cb
     */
    ContentObjectService.prototype.getDrafts = function(options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }

        //ensure a where clause exists
        if (!util.isObject(options.where)) {
            options.where = {};
        }

        //add where clause to weed out published content
        options.where.draft = {
            $in: [1, true]
        };

        this.getAll(options, cb);
    };

    /**
     *
     * @method get
     * @param {string} id
     * @param {object} options
     * @param {Boolean} [options.render=false]
     * @param {Boolean} [options.readMore=false]
     * @param {Function} cb
     */
    ContentObjectService.prototype.get = function(id, options, cb) {

        var self = this;
        var afterGet = function(err, content) {
            if (util.isError(err) || content === null || !options || !options.render) {
                return cb(err, content);
            }

            var renderOptions = self.getRenderOptions(options, false);

            //complete the rendering
            self.render([content], renderOptions, function(err/*, contentArray*/) {
                cb(err, content);
            });
        };
        ContentObjectService.super_.prototype.get.apply(this, [id, options, afterGet]);
    };

    /**
     * Provides the options for rendering
     * @method getRenderOptions
     * @param {Object} options
     * @param {Boolean} isMultiple
     * @return {Object}
     */
    ContentObjectService.prototype.getRenderOptions = function(/*options, isMultiple*/) {
        throw new Error('getRenderOptions must be implemented by the extending prototype');
    };

    /**
     * Retrieves an instance of a content renderer
     * @method getRenderer
     * @return {ContentRenderer}
     */
    ContentObjectService.prototype.getRenderer = function() {
        throw new Error('getRenderer must be implemented by the extending prototype');
    };

    /**
     *
     * @method getSingle
     * @param {Object} [options]
     * @param {Object} [options.select]
     * @param {Object} [options.where]
     * @param {Array} [options.order]
     * @param {Integer} [options.offset]
     * @param {Boolean} [options.readMore=false]
     * @param {Function} cb
     */
    ContentObjectService.prototype.getSingle = function(options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        if (options.readMore === undefined) {
            options.readMore = false;
        }

        ContentObjectService.super_.prototype.getSingle.apply(this, [options, cb]);
    };

    /**
     *
     * @method getAll
     * @param {Object} [options]
     * @param {Object} [options.where]
     * @param {Object} [options.select]
     * @param {Array} [options.order]
     * @param {Integer} [options.limit]
     * @param {Integer} [options.offset]
     * @param {Boolean} [options.render=false]
     * @param {Boolean} [options.readMore=true]
     * @param {Function} cb
     */
    ContentObjectService.prototype.getAll = function(options, cb) {

        var self = this;
        var afterGetAll = function(err, contentArray) {
            if (util.isError(err) || contentArray === null || contentArray.length === 0 || !options || !options.render) {
                return cb(err, contentArray);
            }

            var renderOptions = self.getRenderOptions(options, true);

            //complete the rendering
            self.render(contentArray, renderOptions, cb);
        };
        ContentObjectService.super_.prototype.getAll.apply(this, [options, afterGetAll]);
    };

    /**
     *
     * @method render
     * @param {Array} contentArray
     * @param {Object} [options] An optional argument to provide rendering settings.
     * @param {Boolean} [options.readMore] Specifies if content body layout
     * should be truncated, and read more links rendered.
     * @param {Function} cb
     */
    ContentObjectService.prototype.render = function(contentArray, options, cb) {
        if (arguments.length === 2 && util.isFunction(options)) { // if only two arguments were supplied
            cb = options;
            options = null;
        }

        if (!util.isArray(contentArray)) {
            return cb(new Error('contentArray parameter must be an array'));
        }

        var self  = this;
        this.gatherDataForRender(contentArray, function(err, context) {
            if (util.isError(err)) {
                return cb(err);
            }

            //create tasks for each content object
            var tasks = util.getTasks(contentArray, function(contentArray, i) {
                return function(callback) {

                    //setup individual content context
                    var contentContext = {
                        service: self,
                        data: contentArray[i]
                    };
                    if (options) {
                        util.merge(options, contentContext);
                    }
                    util.merge(context, contentContext);

                    //create tasks for each content object
                    var subTasks = [

                        //before render
                        util.wrapTask(self, self._emit, [ContentObjectService.BEFORE_RENDER, contentContext]),

                        //perform render
                        function(callback) {

                            var renderer = self.getRenderer();
                            renderer.render(contentArray[i], contentContext, callback);
                        },

                        //after render
                        util.wrapTask(self, self._emit, [ContentObjectService.AFTER_RENDER, contentContext])
                    ];
                    async.series(subTasks, callback);
                };
            });
            async.parallel(tasks, function(err/*, results*/) {
                cb(err, contentArray);
            });
        });
    };

    /**
     *
     * @method gatherDataForRender
     * @param {Array} contentArray
     * @param {Function} cb
     */
    ContentObjectService.prototype.gatherDataForRender = function(contentArray, cb) {
        if (!util.isArray(contentArray)) {
            return cb(new Error('contentArray parameter must be an array'));
        }

        var self = this;
        var tasks = {

            contentCount: function(callback) {
                callback(null, contentArray.length);
            },

            authors: function(callback) {

                var opts = {
                    where: DAO.getIdInWhere(contentArray, 'author')
                };
                var dao = new pb.DAO();
                dao.q('user', opts, function(err, authors) {

                    var authorHash = {};
                    if (util.isArray(authors)) {

                        authorHash = util.arrayToHash(authors, function(authors, i) {
                            return authors[i][DAO.getIdField()] + '';
                        });
                    }
                    callback(err, authorHash);
                });
            },

            //retrieve the content settings.
            contentSettings: function(callback) {
                if (util.isObject(self.contentSettings)) {
                    return callback(null, self.contentSettings);
                }

                var contentService = new ContentService({self: self.site});
                contentService.getSettings(callback);
            }
        };
        async.parallel(tasks, cb);
    };

    /**
     * Retrieves the SEO metadata for the specified content.
     * @method getMetaInfo
     * @param {Object} content The content to retrieve information for
     * @param {Function} cb A callback that takes two parameters.  The first is
     * an Error, if occurred.  The second is an object that contains 4
     * properties:
     * title - the SEO title,
     * description - the SEO description,
     * keywords - an array of SEO keywords that describe the content,
     * thumbnail - a URI path to the thumbnail image
     */
    ContentObjectService.prototype.getMetaInfo = function(content, cb) {
        if (util.isNullOrUndefined(content)) {
            return cb(
                new Error('The content parameter cannot be null'),

                //provided for backward compatibility
                {
                    title: '',
                    description: '',
                    thumbnail: '',
                    keywords: []
                }
            );
        }

        //compile the tasks necessary to gather the meta info
        var self = this;
        var tasks = {

            //figure out SEO title
            title: function(callback) {
                var title;
                if (ValidationService.isNonEmptyStr(content.seo_title, true)) {
                    title = content.seo_title;
                }
                else {
                    title = content.headline;
                }
                callback(null, title);
            },

            //figure out the description by taking the explicit meta
            //description or stripping all HTML formatting from the body and
            //using it.
            description: function(callback) {
                var description = '';
                if(util.isString(content.meta_desc)) {
                    description = content.meta_desc;
                }
                else if(ValidationService.isNonEmptyStr(content.layout, true)) {
                    description = content.layout.replace(/<\/?[^>]+(>|$)/g, '').substr(0, 155);
                }
                callback(null, description);
            },

            keywords: function(callback) {

                var keywords  = util.arrayToHash(content.meta_keywords || []);
                var topics    = self.getTopicsForContent(content);
                if (!util.isArray(topics) || topics.length <= 0) {
                    return callback(null, Object.keys(keywords));
                }

                //we know there are topics we need to retrieve them to set the
                //meta keywords
                var opts = {
                    select: {
                        name: 1
                    },
                    where: pb.DAO.getIdInWhere(topics)
                };
                self.topicService.getAll(opts, function(err, topics) {
                    if (util.isError(err)) {
                        return callback(err);
                    }

                    //add to the key word hash.  It is ok if we overwrite an existing
                    //value since it is a hash. We just want a unique set.
                    topics.forEach(function(topic) {
                        keywords[topic.name] = true;
                    });

                    callback(null, Object.keys(keywords));
                });
            },

            thumbnail: function(callback) {

                //no media so skip
                if (!ValidationService.isNonEmptyStr(content.thumbnail, true)) {
                    return callback(null, '');
                }

                //media should exists so go get it
                var mOpts = {
                    select: {
                        location: 1,
                        isFile: 1
                    },
                    where: pb.DAO.getIdWhere(content.thumbnail)
                };
                var mediaService = new pb.MediaServiceV2({ site: self.site, onlyThisSite: self.onlyThisSite });
                mediaService.getSingle(mOpts, function(err, media) {
                    if (media.isFile) {
                        media.location = pb.UrlService.createSystemUrl(media.location);
                    }
                    callback(err, util.isNullOrUndefined(media) ? '' : media.location);
                });
            }
        };
        async.parallel(tasks, cb);
    };

    /**
     * Extracts an array of Topic IDs from the content that the content is associated with.
     * @method getTopicsForContent
     * @param {Object} content
     * @return {Array} An array of strings representing the Topic IDs
     */
    ContentObjectService.prototype.getTopicsForContent = function(/*content*/) {
        throw new Error('getTopicsForContent must be overriden by the extending prototype');
    };

    /**
     * Validates that a headline is provided and is unique
     * @param {object} context
     * @param {object} context.data
     * @param {Array} context.validationErrors
     * @param {function} cb (Error)
     * @returns {*}
     */
    ContentObjectService.prototype.validateHeadline = function(context, cb) {
        var obj = context.data;
        var errors = context.validationErrors;

        //quick check on format
        if (!ValidationService.isNonEmptyStr(obj.headline, true)) {
            errors.push(BaseObjectService.validationFailure('headline', 'The headline is required'));
            return cb();
        }

        //now ensure it is unique
        this.dao.unique(this.type, {headline: obj.headline}, obj[DAO.getIdField()], function(err, unique) {
            if (!unique) {
                errors.push(BaseObjectService.validationFailure('headline', 'The headline must be unique'));
            }
            cb(err);
        });
    };

    /**
     *
     * @static
     * @method setPublishedClause
     * @param {Object} where
     */
    ContentObjectService.setPublishedClause = function(where) {
        where.draft = {
            $nin: [1, true]
        };
        where.publish_date = {
            $lte: new Date()
        };
    };

    return ContentObjectService;
};
