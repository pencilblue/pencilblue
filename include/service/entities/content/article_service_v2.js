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
    var DAO                  = pb.DAO;
    var BaseObjectService    = pb.BaseObjectService;
    var ContentObjectService = pb.ContentObjectService;
    var ValidationService    = pb.ValidationService;

    /**
     * Provides functions to interact with articles
     *
     * @class ArticleServiceV2
     * @constructor
     * @extends BaseObjectService
     * @param {Object} context
     */
    function ArticleServiceV2(context){
        if (!util.isObject(context)) {
            context = {};
        }
        this.site = pb.SiteService.getCurrentSite(context.site);
        this.onlyThisSite = context.onlyThisSite;
        context.type = TYPE;
        ArticleServiceV2.super_.call(this, context);
    }
    util.inherits(ArticleServiceV2, ContentObjectService);

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
     * Provides the options for rendering
     * @method getRenderOptions
     * @param {Object} options
     * @return {Object}
     */
    ArticleServiceV2.prototype.getRenderOptions = function(options, isMultiple) {
        if (isMultiple) {
            return {
                readMore: options && options.readMore !== undefined ? options.readMore : true
            };
        }
        else {
            return {
                readMore: options && options.readMore ? true : false
            };
        }
    };

    /**
     * Retrieves an instance of a content renderer
     * @method getRenderer
     * @return {ArticleRenderer}
     */
    ArticleServiceV2.prototype.getRenderer = function() {
        return new pb.ArticleRenderer(this.context);
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
     * Extracts an array of Topic IDs from the content that the content is associated with.
     * @method getTopicsForContent
     * @param {Object} content
     * @return {Array} An array of strings representing the Topic IDs
     */
    ArticleServiceV2.prototype.getTopicsForContent = function(content) {
        return content.article_topics;
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
                dto.meta_keywords[i] = BaseObjectService.sanitize(dto.meta_keywords[i]);
            }
        }

        cb(null);
    };

    /**
     *
     * @static
     * @method
     * @param {Object} context
     * @param {ArticleServiceV2} context.service An instance of the service that triggered
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
            errors.push(BaseObjectService.validationFailure('draft', 'An invalid draft value was provided.  Must be 1 or 0'));
        }

        if (!ValidationService.isNonEmptyStr(obj.article_layout, true)) {
            errors.push(BaseObjectService.validationFailure('article_layout', 'The layout is required'));
        }

        cb(null);
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