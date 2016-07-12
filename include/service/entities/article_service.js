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
var async = require('async');
var util  = require('../../util.js');

module.exports = function(pb) {

    /**
     * Retrieves articles and pages
     * @deprecated
     * @class ArticleService
     * @constructor
     * @param {string} siteUid
     * @param {boolean} onlyThisSite
     */
    function ArticleService(siteUid, onlyThisSite){
        this.object_type = ARTICLE_TYPE;
        this.site = pb.SiteService.getCurrentSite(siteUid);
        this.onlyThisSite = onlyThisSite;
        this.siteQueryService = new pb.SiteQueryService({site: this.site, onlyThisSite: onlyThisSite});
    }

    /**
     *
     * @private
     * @static
     * @readonly
     * @property ARTICLE_TYPE
     * @type {String}
     */
    var ARTICLE_TYPE = 'article';

    /**
     *
     * @private
     * @static
     * @readonly
     * @property PAGE_TYPE
     * @type {String}
     */
    var PAGE_TYPE = 'page';

    /**
     * Retrieves the content type
     *
     * @method getContentType
     * @return {String} Content type
     */
    ArticleService.prototype.getContentType = function() {
        return this.object_type;
    };

    /**
     * Sets the content type (article, page)
     *
     * @method setContentType
     * @param {String} type The content type
     */
    ArticleService.prototype.setContentType = function(type) {
        this.object_type = type;
    };

    /**
     * Finds an article or page by Id
     *
     * @method findById
     * @param {String}   articleId The article's object Id
     * @param {Function} cb        Callback function
     */
    ArticleService.prototype.findById = function(articleId, cb) {
        this.find(pb.DAO.getIdWhere(articleId), cb);
    };

    /**
     * Finds articles by section
     *
     * @method findBySection
     * @param {String}   sectionId The section's object Id
     * @param {Function} cb        Callback function
     */
    ArticleService.prototype.findBySection = function(sectionId, cb) {
        this.find({article_sections: sectionId}, cb);
    };

    /**
     * Finds articles and pages by topic
     *
     * @method findByTopic
     * @param {[type]}   topicId The topic's object Id
     * @param {Function} cb      Callback function
     */
    ArticleService.prototype.findByTopic = function(topicId, cb) {
        this.find({article_topics: topicId}, cb);
    };

    /**
     * Finds articles and pages matching criteria
     *
     * @method find
     * @param {Object} where Defines the where clause for the article search
     * @param {Object} [options] The options object that can provide query control
     * parameters
     * @param {Array} [options.order] The order that the results will be returned
     * in.  The default is publish date descending and created descending
     * @param {Object} [options.select] The fields that will be returned for each
     * article that matches the criteria
     * @param {Integer} [options.limit] The number of results to return
     * @param {Integer} [options.offset] The number of articles to skip before
     * returning results
     * @param {Function} cb Callback function that takes two parameters: the first
     * is an error, if occurred.  The second is an array of articles or possibly
     * null if an error occurs.
     */
    ArticleService.prototype.find = function(where, options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        else if (!options) {
            options = {};
        }

        //verify the where is valid
        if (!util.isObject(where)) {
            return cb(new Error('The where clause must be an object'));
        }

        //build out query
        if(!where.publish_date) {
            where.publish_date = {$lt: new Date()};
        }
        if(!where.draft) {
            where.draft = {$ne: 1};
        }

        //build out the ordering
        var order;
        if (options.order) {
            order = options.order;
        }
        else {
            order = [['publish_date', pb.DAO.DESC], ['created', pb.DAO.DESC]];
        }

        //build out select
        var select;
        if (util.isObject(options.select)) {
            select = options.select;
        }
        else {
            select = pb.DAO.PROJECT_ALL;
        }

        //build out the limit (must be a valid integer)
        var limit;
        if (pb.validation.isInt(options.limit, true, true)) {
            limit = options.limit;
        }

        //build out the limit (must be a valid integer)
        var offset = 0;
        if (pb.validation.isInt(options.offset, true, true)) {
            offset = options.offset;
        }

        var self = this;
        self.siteQueryService.q(this.getContentType(), {where: where, select: select, order: order, limit: limit, offset: offset}, function(err, articles) {
            if (util.isError(err)) {
                return cb(err, []);
            }
            else if (articles.length === 0) {
                return cb(null, []);
            }

            //get authors
            self.getArticleAuthors(articles, function(err, authors) {

                var contentService = new pb.ContentService({site: self.site});
                contentService.getSettings(function(err, contentSettings) {

                    var tasks = util.getTasks(articles, function(articles, i) {
                        return function(callback) {
                            self.processArticleForDisplay(articles[i], articles.length, authors, contentSettings, options, function(){
                                callback(null, null);
                            });
                        };
                    });
                    async.series(tasks, function(err/*, results*/) {
                        cb(err, articles);
                    });
                });
            });
        });

    };

    /**
     * Updates articles
     * @method update
     * @param {String} articleId	id of article
     * @param {Object} fields	fields to update
     * @param {Object} options
     * @param {Function} cb      Callback function
     */
    ArticleService.prototype.update = function(articleId, fields, options, cb) {
        if(!util.isObject(fields)){
            return cb(new Error('The fields parameter is required'));
        }

        var where = pb.DAO.getIdWhere(articleId);
        var content_type = this.getContentType();

        var dao  = new pb.DAO();
        dao.updateFields(content_type, where, fields, options, cb);
    };

    /**
     * Retrieves data necessary for displaying an articles and appends it to the
     * article object
     *
     * @method processArticleForDisplay
     * @param {Object}   article         The artice to process
     * @param {Number}   articleCount    The total number of articles
     * @param {Array}    authors         Available authors retrieved from the database
     * @param {Object}   contentSettings Content settings to use for processing
     * @param {object} [options]
     * @param {Function} cb              Callback function
     */
    ArticleService.prototype.processArticleForDisplay = function(article, articleCount, authors, contentSettings, options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = cb;
        }

        var self = this;

        if (this.getContentType() === ARTICLE_TYPE) {
            if(contentSettings.display_bylines) {

                for(var j = 0; j < authors.length; j++) {

                    if(pb.DAO.areIdsEqual(authors[j][pb.DAO.getIdField()], article.author)) {
                        if(authors[j].photo && contentSettings.display_author_photo) {
                            article.author_photo     = authors[j].photo;
                            article.media_body_style = '';
                        }

                        article.author_name     = pb.users.getFormattedName(authors[j]);
                        article.author_position = (authors[j].position && contentSettings.display_author_position) ? authors[j].position : '';
                        break;
                    }
                }
            }

            if(contentSettings.display_timestamp ) {
                article.timestamp = pb.ContentService.getTimestampTextFromSettings(
                  article.publish_date,
                  contentSettings
                );
            }

            if(article.article_layout.indexOf('^read_more^') > -1) {
                if(articleCount > 1) {
                    article.article_layout = article.article_layout.substr(0, article.article_layout.indexOf('^read_more^')) + ' <a href="' + pb.config.siteRoot + '/article/' + article.url + '">' + contentSettings.read_more_text + '...</a>';
                }
                else {
                    article.article_layout = article.article_layout.split('^read_more^').join('');
                }
            }
            else if(articleCount > 1 && contentSettings.auto_break_articles) {
                var breakString = '<br>';
                var tempLayout;

                // Firefox uses br and Chrome uses div in content editables.
                // We need to see which one is being used
                var brIndex = article.article_layout.indexOf('<br>');
                if(brIndex === -1) {
                    brIndex = article.article_layout.indexOf('<br />');
                    breakString = '<br />';
                }
                var divIndex = article.article_layout.indexOf('</div>');

                // Temporarily replace double breaks with a directive so we don't mess up the count
                if(divIndex === -1 || (brIndex > -1 && divIndex > -1 && brIndex < divIndex)) {
                    tempLayout = article.article_layout.split(breakString + breakString).join(breakString + '^dbl_pgf_break^');
                }
                else {
                    breakString = '</div>';
                    tempLayout = article.article_layout.split('<div><br></div>').join(breakString + '^dbl_pgf_break^')
                      .split('<div><br /></div>').join(breakString + '^dbl_pgf_break^');
                }

                // Split the layout by paragraphs and remove any empty indices
                var tempLayoutArray = tempLayout.split(breakString);
                for(var i = 0; i < tempLayoutArray.length; i++) {
                    if(!tempLayoutArray[i].length) {
                        tempLayoutArray.splice(i, 1);
                        i--;
                    }
                }

                // Only continue if we have more than 1 paragraph
                if(tempLayoutArray.length > 1) {
                    var newLayout = '';

                    // Cutoff the article at the right number of paragraphs
                    for(i = 0; i < tempLayoutArray.length && i < contentSettings.auto_break_articles; i++) {
                        if(i === contentSettings.auto_break_articles -1 && i !== tempLayoutArray.length - 1) {
                            newLayout += tempLayoutArray[i] + '&nbsp;<a href="' + pb.config.siteRoot + '/article/' + article.url + '">' + contentSettings.read_more_text + '...</a>' + breakString;
                            continue;
                        }
                        newLayout += tempLayoutArray[i] + breakString;
                    }

                    if(breakString === '</div>') {
                        breakString = '<div><br /></div>';
                    }

                    // Replace the double breaks
                    newLayout = newLayout.split('^dbl_pgf_break^').join(breakString);

                    article.article_layout = newLayout;
                }
            }
        }

        article.layout  = article.article_layout;
        var mediaLoader = new MediaLoader({site: self.site, onlyThisSite: self.onlyThisSite});
        mediaLoader.start(article[this.getContentType()+'_layout'], options, function(err, newLayout) {
            article.layout = newLayout;
            delete article.article_layout;

            if (self.getContentType() === ARTICLE_TYPE && ArticleService.allowComments(contentSettings, article)) {

                var opts = {
                    where: {
                        article: article[pb.DAO.getIdField()].toString()
                    },
                    order: [['created', pb.DAO.ASC]]
                };
                var dao   = new pb.DAO();
                dao.q('comment', opts, function(err, comments) {
                    if(util.isError(err) || comments.length === 0) {
                        return cb(null, null);
                    }

                    self.getCommenters(comments, contentSettings, function(err, commentsWithCommenters) {
                        article.comments = commentsWithCommenters;
                        cb(null, null);
                    });
                });
            }
            else {
                cb(null, null);
            }
        });
    };

    /**
     * Retrieves the authors of an array of articles
     *
     * @method getArticleAuthors
     * @param {Array}    articles Array of article objects
     * @param {Function} cb       Callback function
     */
    ArticleService.prototype.getArticleAuthors = function(articles, cb) {

        //gather all author IDs
        var dao = new pb.DAO();
        dao.q('user', {where: pb.DAO.getIdInWhere(articles, 'author')}, cb);
    };

    /**
     * Retrieves the commenters for an array of comments
     *
     * @method getCommenters
     * @param {Array}    comments        Array of comment objects
     * @param {Object}   contentSettings Content settings to use for processing
     * @param {Function} cb              Callback function
     */
    ArticleService.prototype.getCommenters = function(comments, contentSettings, cb) {

        //callback for iteration to handle setting the commenter attributes
        var processComment = function(comment, commenter) {
            comment.commenter_name = 'Anonymous';
            comment.timestamp      = pb.ContentService.getTimestampTextFromSettings(comment.created, contentSettings);

            if (commenter) {
                comment.commenter_name = pb.users.getFormattedName(commenter);
                if(commenter.photo) {
                    comment.commenter_photo = commenter.photo;
                }
                if(commenter.position) {
                    comment.commenter_position = commenter.position;
                }
            }
        };

        var processedComments = [];
        var users             = {};
        var tasks             = util.getTasks(comments, function(comments, i) {
            return function(callback) {

                var comment   = comments[i];
                if (!comment.commenter || users[comment.commenter]) {

                    //user already commented so pull locally
                    processComment(comment, users[comment.commenter]);
                    processedComments.push(comment);
                    callback(null, true);
                    return;
                }

                //user has not already commented so load
                var dao = new pb.DAO();
                dao.loadById(comment.commenter, 'user', function(err, commenter) {
                    if(util.isError(err) || commenter === null) {
                        callback(null, false);
                        return;
                    }

                    //process the comment
                    users[commenter[pb.DAO.getIdField()].toString()] = commenter;
                    processComment(comment, commenter);
                    processedComments.push(comment);

                    callback(null, true);
                });
            };
        });
        async.series(tasks, function(err/*, result*/) {
            cb(err, processedComments);
        });
    };

    /**
     * Retrieves the article and byline templates
     *
     * @method getTemplates
     * @param {Object} [opts]
     * @param {Function} cb Callback function
     */
    ArticleService.prototype.getTemplates = function(opts, cb) {
        if (util.isFunction(opts)) {
            cb = opts;
            opts = {};
        }

        var ts = new pb.TemplateService(opts);
        ts.load('elements/article', function(err, articleTemplate) {
            ts.load('elements/article/byline', function(err, bylineTemplate) {
                cb(articleTemplate, bylineTemplate);
            });
        });
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
    ArticleService.prototype.getMetaInfo = function(article, cb) {
        var serviceV2 = new pb.ArticleServiceV2({site: this.site, onlyThisSite: this.onlyThisSite});
        serviceV2.getMetaInfo(article, cb);
    };

    /**
     * Retrieves the meta info for an article or page
     * @deprecated Since 0.4.1
     * @method getMetaInfo
     * @param {Object}   article An article or page object
     * @param {Function} cb      Callback function
     */
    ArticleService.getMetaInfo = function(article, cb) {
        if(util.isNullOrUndefined(article)) {
            return cb('', '', '');
        }

        //log deprecation
        pb.log.warn('ArticleService: ArticleService.getMetaInfo is deprecated and will be removed 0.5.0.  Use the prototype function getMetaInfo instead');

        //all wrapped up to ensure we can be multi-threaded here for backwards
        //compatibility
        (function(cb) {

            var articleService = new ArticleService();
            articleService.getMetaInfo(article, function(err, meta) {
                if (util.isError(err)) {
                    return cb('', '', '');
                }

                cb(meta.keywords, meta.description, meta.title, meta.thumbnail);
            });
        })(cb);
    };

    /**
     * Provided the content descriptor and the content settings object the
     * function indicates if comments should be allowed within the given
     * context of the content.
     * @method allowComments
     * @param {Object} contentSettings The settings object retrieved from the
     * content service
     * @param {Object} content The page or article that should or should not
     * have associated comments.
     * @return {Boolean}
     */
    ArticleService.allowComments = function(contentSettings, content) {
        return contentSettings.allow_comments && content.allow_comments;
    };

    /**
     * Handles retrieval and injection of media in articles and pages
     *
     * @module Services
     * @class MediaLoader
     * @constructor
     * @submodule Entities
     */
    function MediaLoader(opts) {
        /**
         * @property mediaService
         * @type {MediaService}
         */
        this.service = new pb.MediaServiceV2(opts);
    }

    /**
     * Processes an article or page to insert media
     * @method start
     * @param  {String} articleLayout The HTML layout of the article or page
     * @param {object} [options]
     * @param  {Function} cb
     */
    MediaLoader.prototype.start = function(articleLayout, options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }
        if (!util.isObject(options.media)) {
            options.media = {};
        }

        //scan for media that should be retrieved
        var flags = this.scanForFlags(articleLayout);
        if (flags.length === 0) {
            return cb(null, articleLayout);
        }

        //reconcile what media is already cached and that which should be loaded
        var idsToRetrieve = [];
        flags.forEach(function(flag) {
            if (!options.media[flag.id]) {
                idsToRetrieve.push(flag.id);
            }
        });

        //when all media is already cached just do the processing
        if (idsToRetrieve.length === 0) {
            return this.onMediaAvailable(articleLayout, options, cb);
        }

        //retrieve the media that we need
        var self = this;
        var opts = {
            where: idsToRetrieve.length === 1 ? pb.DAO.getIdWhere(idsToRetrieve[0]) : pb.DAO.getIdInWhere(idsToRetrieve)
        };
        this.service.getAll(opts, function(err, media) {
            if (util.isError(err)) {
                return cb(err);
            }

            //cache the retrieved media
            var idField = pb.DAO.getIdField();
            media.forEach(function(mediaItem) {
                options.media[mediaItem[idField].toString()] = mediaItem;
            });

            self.onMediaAvailable(articleLayout, options, cb);
        });
    };

    /**
     * @method onMediaAvailable
     * @param {String} articleLayout
     * @param {Object} options
     * @param {Function} cb
     */
    MediaLoader.prototype.onMediaAvailable = function(articleLayout, options, cb) {
        var self = this;

        this.getMediaTemplate(options, function(err, mediaTemplate) {
            options.mediaTemplate = mediaTemplate;

            async.whilst(
              function() {return articleLayout.indexOf('^media_display_') >= 0;},
              function(callback) {
                  self.replaceMediaTag(articleLayout, mediaTemplate, options.media, function(err, newArticleLayout) {
                      articleLayout = newArticleLayout;
                      callback();
                  });
              },
              function(err) {
                  cb(err, articleLayout);
              }
            );
        });
    };

    /**
     * Retrieves the media template for rendering media
     * @method getMediaTemplate
     * @param {Object} options
     * @param {string} [options.mediaTemplatePath='elements/media']
     * @param {Function} cb
     */
    MediaLoader.prototype.getMediaTemplate = function(options, cb) {
        if (options.mediaTemplate) {
            return cb(null, options.mediaTemplate);
        }

        var ts = new pb.TemplateService(options);
        ts.load(options.mediaTemplatePath || 'elements/media', cb);
    };

    /**
     * Scans a string for media flags then parses them to return an array of
     * each one that was found
     * @method scanForFlags
     * @param {String} layout
     * @return {Array}
     */
    MediaLoader.prototype.scanForFlags = function(layout) {
        if (!util.isString(layout)) {
            return [];
        }

        var index;
        var flags = [];
        while( (index = layout.indexOf('^media_display_')) >= 0) {
            flags.push(pb.MediaServiceV2.extractNextMediaFlag(layout));

            var nexPosition = layout.indexOf('^', index + 1);
            layout = layout.substr(nexPosition);
        }
        return flags;
    };

    /**
     * Replaces an article or page layout's ^media_display^ tag with a media embed
     * @method replaceMediaTag
     * @param {String}   layout        The HTML layout of the article or page
     * @param {String}   mediaTemplate The template of the media embed
     * @param {object} mediaCache
     * @param {Function} cb            Callback function
     */
    MediaLoader.prototype.replaceMediaTag = function(layout, mediaTemplate, mediaCache, cb) {
        var flag = pb.MediaServiceV2.extractNextMediaFlag(layout);
        if (!flag) {
            return cb(null, layout);
        }

        var data = mediaCache[flag.id];
        if (!data) {
            pb.log.warn("MediaLoader: Content contains reference to missing media [%s].", flag.id);
            return cb(null, layout.replace(flag.flag, ''));
        }

        //ensure the max height is set if explicity set for media replacement
        var options = {
            view: 'post',
            style: {},
            attrs: {
                frameborder: "0",
                allowfullscreen: ""
            }
        };
        if (flag.style.maxHeight) {
            options.style['max-height'] = flag.style.maxHeight;
        }
        this.service.render(data, options, function(err, html) {
            if (util.isError(err)) {
                return cb(err);
            }

            //get the style for the container
            var containerStyleStr = pb.MediaServiceV2.getStyleForPosition(flag.style.position) || '';

            //finish up replacements
            var mediaEmbed = mediaTemplate.split('^media^').join(html);
            mediaEmbed     = mediaEmbed.split('^caption^').join(data.caption);
            mediaEmbed     = mediaEmbed.split('^display_caption^').join(data.caption ? '' : 'display: none');
            mediaEmbed     = mediaEmbed.split('^container_style^').join(containerStyleStr);
            cb(null, layout.replace(flag.flag, mediaEmbed));
        });
    };

    //exports
    return {
        ArticleService: ArticleService,
        MediaLoader: MediaLoader
    };
};
