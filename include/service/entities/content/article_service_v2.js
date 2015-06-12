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
var util  = require('../../../util.js');
var async = require('async');

module.exports = function(pb) {
    
    //pb dependencies
    var DAO               = pb.DAO;
    var ContentService    = pb.ContentService;
    var BaseObjectService = pb.BaseObjectService;
    var ValidationService = pb.ValidationService;

    /**
     * Provides functions to interact with articles
     *
     * @class ArticleServiceV2
     * @constructor
     * @extends BaseObjectService
     */
    function ArticleServiceV2(context){
        if (!util.isObject(context)) {
            context = {};
        }
        
        /**
         *
         * @property contentSettings
         * @type {Object}
         */
        this.contentSettings = context.contentSettings;
        
        context.type = TYPE;
        ArticleServiceV2.super_.call(this, context);
    }
    util.inherits(ArticleServiceV2, BaseObjectService);
    
    /**
     * 
     * @static
     * @readonly
     * @property BEFORE_RENDER
     * @type {String}
     */
    ArticleServiceV2.BEFORE_RENDER = 'beforeRender';
    
    /**
     * 
     * @static
     * @readonly
     * @property AFTER_RENDER
     * @type {String}
     */
    ArticleServiceV2.AFTER_RENDER = 'afterRender';
    
    /**
     * 
     * @private
     * @static
     * @readonly
     * @property TYPE
     * @type {String}
     */
    var TYPE = 'article';
    
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
    ArticleServiceV2.prototype.getPublished = function(options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }
        
        //ensure a where clause exists
        if (!util.isObject(options.where)) {
            options.where = {};
        }
        
        //add where clause to weed out drafts
        ArticleServiceV2.setPublishedClause(options.where);
        
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
    ArticleServiceV2.prototype.getDrafts = function(options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }
        
        //ensure a where clause exists
        if (!util.isObject(options.where)) {
            options.where = {};
        }
        
        //add where clause to weed out published articles
        options.where.draft = {
            $in: [1, true]
        };
        
        this.getAll(options, cb);
    };
    
    /**
     * 
     * @method get
     * @param {String} id
     * @param {object} options
     * @param {Boolean} [options.render=false]
     * @param {Function} cb
     */
    ArticleServiceV2.prototype.get = function(id, options, cb) {
        
        var self = this;
        var afterGet = function(err, article) {
            if (util.isError(err) || article === null || !options || !options.render) {
                return cb(err, article);
            }
            
            //complete the rendering
            self.render([article], function(err/*, articles*/) {
                cb(err, article);
            });
        };
        ArticleServiceV2.super_.prototype.get.apply(this, [id, options, afterGet]);
    };
    
    /**
     * Retrieves articles based on the section
     * @method getBySection
     * @param {String|Object} sectionId
     * @param {Object} [options]
     * @param {Function} cb
     */
    ArticleServiceV2.prototype.getBySection = function(sectionId, options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }
        
        //ensure a where clause exists
        if (!util.isObject(options.where)) {
            options.where = {};
        }
        
        //add where clause to search based on section
        var section = sectionId;
        if (util.isObject(section)) {
            section = section[pb.DAO.getIdField()] + '';
        }
        options.where.article_sections = section;
        
        this.getAll(options, cb);
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
     * @param {Function} cb
     */
    ArticleServiceV2.prototype.getAll = function(options, cb) {
        
        var self = this;
        var afterGetAll = function(err, articles) {
            if (util.isError(err) || articles === null || articles.length === 0 || !options || !options.render) {
                return cb(err, articles);
            }
            
            //complete the rendering
            self.render(articles, cb);
        };
        ArticleServiceV2.super_.prototype.getAll.apply(this, [options, afterGetAll]);
    };
    
    /**
     *
     * @method render
     * @param {Array} articles
     * @param {Function} cb
     */
    ArticleServiceV2.prototype.render = function(articles, cb) {
        if (!util.isArray(articles)) {
            return cb(new Error('articles parameter must be an array'));
        }
        
        var self  = this;
        this.gatherDataForRender(articles, function(err, context) {
            if (util.isError(err)) {
                return cb(err);
            }
            
            //create tasks for each article
            var tasks = util.getTasks(articles, function(articles, i) {
                return function(callback) {

                    //setup individual article context
                    var articleContext = {
                        service: self,
                        data: articles[i]
                    };
                    util.merge(context, articleContext);
                    
                    //create tasks for each article
                    var subTasks = [

                        //before render
                        util.wrapTask(self, self._emit, [ArticleServiceV2.BEFORE_RENDER, articleContext]),

                        //perform render
                        function(callback) {

                            var renderer = new pb.ArticleRenderer();
                            renderer.render(articles[i], articleContext, callback);
                        },

                        //after render
                        util.wrapTask(self, self._emit, [ArticleServiceV2.AFTER_RENDER, articleContext])
                    ];
                    async.series(subTasks, callback);
                };
            });
            async.parallel(tasks, function(err, results) {
                cb(err, articles);
            });
        });
    };
    
    /**
     *
     * @method gatherDataForRender
     * @param {Array} articles
     * @param {Function} cb
     */
    ArticleServiceV2.prototype.gatherDataForRender = function(articles, cb) {
        var self = this;
        if (!util.isArray(articles)) {
            return cb(new Error('articles parameter must be an array'));
        }
        
        var self = this;
        var tasks = {
            
            articleCount: function(callback) {
                callback(null, articles.length);
            },
            
            authors: function(callback) {
                
                var opts = {
                    where: DAO.getIdInWhere(articles, 'author')
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
            
            contentSettings: function(callback) {
                if (util.isObject(self.contentSettings)) {
                    return callback(null, self.contentSettings);
                }
                
                var contentService = new pb.ContentService(self.context.site, self.context.onlyThisSite);
                contentService.getSettings(callback);
            }
        };
        async.parallel(tasks, cb);
    };
    
    /**
     * Retrieves the SEO metadata for the specified content.  
     * @method getMetaInfo
     * @param {Object} article The article to retrieve information for
     * @param {Function} cb A callback that takes two parameters.  The first is 
     * an Error, if occurred.  The second is an object that contains 4 
     * properties: 
     * title - the SEO title, 
     * description - the SEO description, 
     * keywords - an array of SEO keywords that describe the content, 
     * thumbnail - a URI path to the thumbnail image 
     */
    ArticleServiceV2.prototype.getMetaInfo = function(article, cb) {
        var self = this;
        if (util.isNullOrUndefined(article)) {
            return cb(
                new Error('The article parameter cannot be null'),
                
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
        var tasks = {
            
            //figure out SEO title
            title: function(callback) {
                var title;
                if (pb.ValidationService.isNonEmptyStr(article.seo_title, true)) {
                    title = article.seo_title;
                }
                else {
                    title = article.headline;
                }
                callback(null, title);
            },
            
            //figure out the description by taking the explicit meta 
            //description or stripping all HTML formatting from the body and 
            //using it.
            description: function(callback) {
                var description = '';
                if(util.isString(article.meta_desc)) {
                    description = article.meta_desc;
                }
                else if(pb.ValidationService.isNonEmptyStr(article.layout, true)) {
                    description = article.layout.replace(/<\/?[^>]+(>|$)/g, '').substr(0, 155);
                }
                callback(null, description);
            },
            
            keywords: function(callback) {
                
                var keywords  = util.arrayToHash(article.meta_keywords || []);
                var topics    = article.article_topics || article.page_topics;
                if (!util.isArray(topics) || topics.length <= 0) {
                    return callback(null, Object.keys(keywords));
                }
                
                //we know there are topics we need to retrieve them to set the 
                //meta keywords
                var opts = {
                    select: {
                        name: 1
                    },
                    where: pb.DAO.getIdInWhere(article.article_topics || article.page_topics)
                };
                var topicService = new pb.TopicService(self.context);
                topicService.getAll(opts, function(err, topics) {
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
                if (!pb.ValidationService.isNonEmptyStr(article.thumbnail, true)) {
                    return callback(null, '');
                }
                
                //media should exists so go get it
                var mOpts = {
                    select: {
                        location: 1
                    },
                    where: pb.DAO.getIdWhere(article.thumbnail)
                };
                var mediaService = new pb.MediaService(null, self.context.site, self.context.onlyThisSite);
                mediaService.get(mOpts, function(err, media) {
                    callback(err, util.isNullOrUndefined(media) ? '' : media.location);
                });
            }
        };
        async.parallel(tasks, cb);
    };
    
    /**
     * 
     * @static
     * @method 
     * @param {Object} context
     * @param {ArticleServiceV2} service An instance of the service that triggered 
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    ArticleServiceV2.format = function(context, cb) {
        var dto = context.data;
        dto.headline = BaseObjectService.sanitize(dto.headline);
        dto.subheading = BaseObjectService.sanitize(dto.subheading);
        dto.article_layout = BaseObjectService.sanitize(dto.article_layout, BaseObjectService.getContentSanitizationRules());
        dto.focus_keyword = BaseObjectService.sanitize(dto.focus_keyword);
        dto.seo_title = BaseObjectService.sanitize(dto.seo_title);
        dto.meta_desc = BaseObjectService.sanitize(dto.meta_desc);
        dto.url = BaseObjectService.sanitize(dto.url);
        dto.publish_date = BaseObjectService.getDate(dto.publish_date);
        
        if (util.isArray(dto.meta_keywords)) {
            for (var i = 0; i < dto.meta_keywords.length; i++) {
                dto.meta_keywords[i] = BaseObjectService.getDate(dto.meta_keywords[i]);  
            }
        }
        
        cb(null);
    };
    
    /**
     * 
     * @static
     * @method 
     * @param {Object} context
     * @param {ArticleServiceV2} service An instance of the service that triggered 
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    ArticleServiceV2.merge = function(context, cb) {
        var dto = context.data;
        var obj = context.object;
        
        obj.author = dto.author;
        obj.publish_date = dto.publish_date;
        obj.meta_keywords = dto.meta_keywords;
        obj.article_media = dto.article_media;
        obj.article_sections = dto.article_sections;
        obj.article_topics = dto.article_topics;
        obj.url = dto.url;
        obj.template = dto.template;
        obj.headline = dto.headline;
        obj.subheading = dto.subheading;
        obj.allow_comments = dto.allow_comments;
        obj.focus_keyword = dto.focus_keyword;
        obj.seo_title = dto.seo_title;
        obj.meta_desc = dto.meta_desc;
        obj.thumbnail = dto.thumbnail;
        obj.draft = dto.draft;
        obj.article_layout = dto.article_layout;

        cb(null);
    };
    
    /**
     * 
     * @static
     * @method validate
     * @param {Object} context
     * @param {Object} context.data The DTO that was provided for persistence
     * @param {ArticleServiceV2} context.service An instance of the service that triggered 
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    ArticleServiceV2.validate = function(context, cb) {
        var obj = context.data;
        var errors = context.validationErrors;
        
        if (!ValidationService.isIdStr(obj.author, true)) {
            errors.push(BaseObjectService.validationFailure('author', 'Author is required'));
        }
        
        if (!ValidationService.isDate(obj.publish_date, true)) {
            errors.push(BaseObjectService.validationFailure('publish_date', 'Publish date is required'));
        }
        
        if (!util.isArray(obj.meta_keywords)) {
            if (!util.isNullOrUndefined(obj.meta_keywords)) {
                errors.push(BaseObjectService.validationFailure('meta_keywords', 'Meta Keywords must be an array'));
            }
        }
        else {
            obj.meta_keywords.forEach(function(keyword, i) {
                
                if (!ValidationService.isNonEmptyStr(keyword, true)) {
                    errors.push(BaseObjectService.validationFailure('meta_keywords['+i+']', 'An invalid meta keyword was provided'));
                }
            });
        }
        
        if (!util.isArray(obj.article_media)) {
            if (!util.isNullOrUndefined(obj.article_media)) {
                errors.push(BaseObjectService.validationFailure('article_media', 'Article Media must be an array'));
            }
        }
        else {
            obj.article_media.forEach(function(mediaId, i) {
                
                if (!ValidationService.isIdStr(mediaId, true)) {
                    errors.push(BaseObjectService.validationFailure('article_media['+i+']', 'An invalid media ID was provided'));
                }
            });
        }
        
        if (!util.isArray(obj.article_sections)) {
            if (!util.isNullOrUndefined(obj.article_sections)) {
                errors.push(BaseObjectService.validationFailure('article_sections', 'Article sections must be an array'));
            }
        }
        else {
            obj.article_sections.forEach(function(sectionId, i) {
                
                if (!ValidationService.isIdStr(sectionId, true)) {
                    errors.push(BaseObjectService.validationFailure('article_sections['+i+']', 'An invalid section ID was provided'));
                }
            });
        }
        
        if (!util.isArray(obj.article_topics)) {
            if (!util.isNullOrUndefined(obj.article_topics)) {
                errors.push(BaseObjectService.validationFailure('article_topics', 'Article topics must be an array'));
            }
        }
        else {
            obj.article_topics.forEach(function(topicId, i) {
                
                if (!ValidationService.isIdStr(topicId, true)) {
                    errors.push(BaseObjectService.validationFailure('article_topics['+i+']', 'An invalid topic ID was provided'));
                }
            });
        }
        
        if (!ValidationService.isNonEmptyStr(obj.url, true)) {
            errors.push(BaseObjectService.validationFailure('url', 'An invalid URL slug was provided'));
        }
        
        if (!util.isNullOrUndefined(obj.template)) {
            
            if (!ValidationService.isStr(obj.template, false)) {
                errors.push(BaseObjectService.validationFailure('template', 'The template must take the form of [PLUGIN]|[TEMPLATE_NAME]'));
            }
            else if (obj.template.length > 0){
                var parts = obj.template.split('|');
                if (parts.length !== 2) {
                    errors.push(BaseObjectService.validationFailure('template', 'The template must take the form of [PLUGIN]|[TEMPLATE_NAME]'));
                }
            }
        }
        
        if (!ValidationService.isNonEmptyStr(obj.headline, true)) {
            errors.push(BaseObjectService.validationFailure('headline', 'The headline is required'));
        }
        
        if (!ValidationService.isNonEmptyStr(obj.subheading, false)) {
            errors.push(BaseObjectService.validationFailure('subheading', 'An invalid subheading was provided'));
        }
        
        if (!util.isBoolean(obj.allow_comments)) {
            errors.push(BaseObjectService.validationFailure('allow_comments', 'An invalid allow comments value was provided'));
        }
        
        if (!ValidationService.isStr(obj.focus_keyword, false)) {
            errors.push(BaseObjectService.validationFailure('focus_keyword', 'An invalid focus keyword was provided'));
        }
        
        if (!ValidationService.isStr(obj.seo_title, false)) {
            errors.push(BaseObjectService.validationFailure('seo_title', 'An invalid SEO title was provided'));
        }
        
        if (!ValidationService.isStr(obj.meta_desc, false)) {
            errors.push(BaseObjectService.validationFailure('meta_desc', 'An invalid meta description was provided'));
        }
        
        if (!ValidationService.isIdStr(obj.thumbnail, false)) {
            errors.push(BaseObjectService.validationFailure('thumbnail', 'An invalid thumbnail media ID was provided'));
        }
        
        if (obj.draft !== 1 && obj.draft !== 0) {
            errors.push(BaseObjectService.validationFailure('thumbnail', 'An invalid draft value was provided.  Must be 1 or 0'));
        }
        
        if (!ValidationService.isNonEmptyStr(obj.article_layout, true)) {
            errors.push(BaseObjectService.validationFailure('article_layout', 'The layout is required'));
        }
        
        cb(null);
    };
    
    /**
     *
     * @static
     * @method setPublishedClause
     * @param {Object} where
     */
    ArticleServiceV2.setPublishedClause = function(where) {
        where.draft = {
            $nin: [1, true]
        };
        where.publish_date = {
            $lte: new Date()
        };
    };
    
    /**
     *
     * @static
     * @method setSectionClause
     * @param {Object} where
     */
    ArticleServiceV2.setSectionClause = function(where, sectionId) {
        where.article_sections = sectionId + '';
    };
    
    /**
     *
     * @static
     * @method setTopicClause
     * @param {Object} where
     */
    ArticleServiceV2.setTopicClause = function(where, topicId) {
        where.article_topics = topicId + '';
    };
    
    //Event Registries
    BaseObjectService.on(TYPE + '.' + BaseObjectService.FORMAT, ArticleServiceV2.format);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.MERGE, ArticleServiceV2.merge);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.VALIDATE, ArticleServiceV2.validate);
    
    return ArticleServiceV2;
};