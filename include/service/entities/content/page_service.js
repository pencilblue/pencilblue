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
    var BaseObjectService    = pb.BaseObjectService;
    var ContentObjectService = pb.ContentObjectService;
    var ValidationService    = pb.ValidationService;

    /**
     * Provides functions to interact with pages
     *
     * @class PageService
     * @extends ContentObjectService
     * @constructor
     * @param {object} context
     * @param {object} [context.contentSettings]
     * @param {string} context.site
     * @param {boolean} context.onlyThisSite
     */
    function PageService(context){
        if (!util.isObject(context)) {
            context = {};
        }

        context.type = TYPE;
        PageService.super_.call(this, context);
    }
    util.inherits(PageService, ContentObjectService);

    /**
     *
     * @private
     * @static
     * @readonly
     * @property TYPE
     * @type {String}
     */
    var TYPE = 'page';

    /**
     * Provides the options for rendering
     * @method getRenderOptions
     * @param {Object} options
     * @param {Boolean} isMultiple
     * @return {Object}
     */
    PageService.prototype.getRenderOptions = function(options/*, isMultiple*/) {
        if (!util.isObject(options)) {
            options = {};
        }

        return util.merge(options, {
            readMore: false,
            renderComments: false,
            renderBylines: false,
            renderTimestamp: false
        });
    };

    /**
     * Retrieves an instance of a content renderer
     * @method getRenderer
     * @return {PageRenderer}
     */
    PageService.prototype.getRenderer = function() {
        return new pb.PageRenderer(this.context);
    };

    /**
     * Extracts an array of Topic IDs from the content that the content is associated with.
     * @method getTopicsForContent
     * @param {Object} content
     * @return {Array} An array of strings representing the Topic IDs
     */
    PageService.prototype.getTopicsForContent = function(content) {
        return content.page_topics;
    };

    /**
     *
     * @static
     * @method format
     * @param {Object} context
     * @param {PageService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {object} context.data
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    PageService.format = function(context, cb) {
        var dto = context.data;
        dto.headline = BaseObjectService.sanitize(dto.headline);
        dto.subheading = BaseObjectService.sanitize(dto.subheading);
        dto.page_layout = BaseObjectService.sanitize(dto.page_layout, BaseObjectService.getContentSanitizationRules());
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
     * @method merge
     * @param {Object} context
     * @param {PageService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {object} context.data
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    PageService.merge = function(context, cb) {
        var dto = context.data;
        var obj = context.object;

        obj.author = dto.author;
        obj.publish_date = dto.publish_date;
        obj.meta_keywords = dto.meta_keywords;
        obj.page_media = dto.page_media;
        obj.page_topics = dto.page_topics;
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
        obj.page_layout = dto.page_layout;

        cb(null);
    };

    /**
     *
     * @static
     * @method validate
     * @param {Object} context
     * @param {Object} context.data The DTO that was provided for persistence
     * @param {Array} context.data.page_topics
     * @param {PageService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    PageService.validate = function(context, cb) {
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

        if (!util.isArray(obj.page_media)) {
            if (!util.isNullOrUndefined(obj.page_media)) {
                errors.push(BaseObjectService.validationFailure('page_media', 'Page Media must be an array'));
            }
        }
        else {
            obj.page_media.forEach(function(mediaId, i) {

                if (!ValidationService.isIdStr(mediaId, true)) {
                    errors.push(BaseObjectService.validationFailure('page_media['+i+']', 'An invalid media ID was provided'));
                }
            });
        }

        if (!util.isArray(obj.page_topics)) {
            if (!util.isNullOrUndefined(obj.page_topics)) {
                errors.push(BaseObjectService.validationFailure('page_topics', 'Page topics must be an array'));
            }
        }
        else {
            obj.page_topics.forEach(function(topicId, i) {

                if (!ValidationService.isIdStr(topicId, true)) {
                    errors.push(BaseObjectService.validationFailure('page_topics['+i+']', 'An invalid topic ID was provided'));
                }
            });
        }

        if (!ValidationService.isNonEmptyStr(obj.url, true)) {
            errors.push(BaseObjectService.validationFailure('url', 'An invalid URL slug was provided'));
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

        if (!ValidationService.isNonEmptyStr(obj.page_layout, true)) {
            errors.push(BaseObjectService.validationFailure('page_layout', 'The layout is required'));
        }

        context.service.validateHeadline(context, cb);
    };

    /**
     *
     * @static
     * @method setSectionClause
     * @param {Object} where
     * @param {string} sectionId
     */
    PageService.setSectionClause = function(where, sectionId) {
        where.article_sections = sectionId + '';
    };

    /**
     *
     * @static
     * @method setTopicClause
     * @param {Object} where
     * @param {string} topicId
     */
    PageService.setTopicClause = function(where, topicId) {
        where.page_topics = topicId + '';
    };

    //Event Registries
    BaseObjectService.on(TYPE + '.' + BaseObjectService.FORMAT, PageService.format);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.MERGE, PageService.merge);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.VALIDATE, PageService.validate);

    return PageService;
};
