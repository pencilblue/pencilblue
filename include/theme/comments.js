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
const util  = require('../util.js');
const _ = require('lodash');
const ArticleServiceV2 = require('../service/entities/content/article_service_v2');
const async = require('async');
const BaseObjectService = require('../service/base_object_service');
const ContentService = require('../content');
const DAO = require('../dao/dao');
const log = require('../utils/logging').newInstance('CommentService');
const SecurityService = require('../access_management');
const TemplateService = require('../service/entities/template_service').TemplateService;
const UserService = require('../service/entities/user_service');
const ValidationService = require('../validation/validation_service');

/**
 * Retrieves comment information
 *
 * @module Services
 * @submodule Theme
 * @class CommentService
 * @extends BaseObjectService
 * @constructor
 * @param {Object} context
 * @param {string} context.site
 * @param {boolean} context.onlyThisSite
 */
class CommentService extends BaseObjectService {
    constructor(context) {
        context.type = CommentService.TYPE;
        super(context);

        /**
         *
         * @property userService
         * @type {UserService}
         */
        this.userService = new UserService(context);

        /**
         *
         * @property articleService
         * @type {ArticleService}
         */
        this.articleService = new ArticleServiceV2(context);

        /**
         *
         * @property contentService
         * @type {ContentService}
         */
        this.contentService = new ContentService(context);
    }

    /**
     * @readonly
     * @type {String}
     */
    static get TYPE() {
        return 'comment';
    }

    /**
     * Validates a comment
     * @method validate
     * @param {Object} context
     * @param {Function} cb
     */
    validate(context, cb) {
        var obj = context.data;
        var errors = context.validationErrors;

        if (!ValidationService.isNonEmptyStr(obj.content, true)) {
            errors.push(BaseObjectService.validationFailure('content', 'Content is required'));
        }

        if (!ValidationService.isIdStr(obj.commenter)) {
            errors.push(BaseObjectService.validationFailure('commenter', 'An invalid commenter ID was provided'));
        }

        if (!ValidationService.isIdStr(obj.article, true)) {
            errors.push(BaseObjectService.validationFailure('article', 'The article ID is required'));
        }

        var principal = SecurityService.getPrincipal(context.session);
        var isAdmin = SecurityService.isAuthorized(context.session, {admin_level: SecurityService.ACCESS_ADMINISTRATOR});

        if (!ValidationService.isIdStr(obj.commenter)) {
            errors.push(BaseObjectService.validationFailure('commenter', 'An invalid commenter ID was provided'));
        }
        else if (context.isUpdate) {

            if (obj.commenter === null && !isAdmin) {

                //you can't edit an anonymous comment unless you are an admin
                errors.push(BaseObjectService.validationFailure('commenter', 'Only admins can edit anonymous comments'));
            }
            else if (principal && obj.commenter !== principal[DAO.getIdField()].toString() && !isAdmin) {

                //you can't edit a comment unless it is your comment or you are an admin
                errors.push(BaseObjectService.validationFailure('commenter', 'Only admins can edit another user\'s comment'));
            }
        }
        else if (context.isCreate) {

            if (principal !== null && obj.commenter === null) {

                //you can't create a comment anonymously if you are authenticated
                errors.push(BaseObjectService.validationFailure('commenter', 'An authenticated user must be the comment creator'));
            }
        }

        var self = this;
        var tasks = [

            //validate commenter exists
            function (callback) {
                if (!ValidationService.isIdStr(obj.commenter, true)) {
                    return callback();
                }

                //check for existence of user
                self.userService.get(obj.commenter, function (err, user) {
                    if (!_.isObject(user)) {
                        errors.push(BaseObjectService.validationFailure('commenter', 'An invalid  commenter ID was provided'));
                    }
                    callback(err);
                });
            },


            //validate article exists
            function (callback) {

                //retrieve the article to ensure it exists
                self.articleService.get(obj.article, function (err, article) {
                    if (!_.isObject(article)) {
                        errors.push(BaseObjectService.validationFailure('article', 'An invalid article ID was provided'));
                        return callback(err);
                    }

                    //ensure the article supports comments
                    if (!article.allow_comments) {
                        errors.push(BaseObjectService.validationFailure('article', 'The specified article does not allow comments'));
                        return callback(err);
                    }

                    //ensure the site supports comments
                    self.contentService.get(function (err, settings) {
                        if (_.isObject(settings) && !settings.allow_comments) {
                            errors.push(BaseObjectService.validationFailure('article', 'Comments are not enabled'));
                        }
                        return callback(err);
                    });
                });
            }
        ];
        async.parallel(tasks, cb);
    }

    /**
     * Retrieves the template for comments
     *
     * @method getCommentsTemplates
     * @param {Object} contentSettings The content settings to use with retrieval
     * @param {Function} output        Callback function
     */
    static getCommentsTemplates(contentSettings, output) {
        var self = this;

        if (!contentSettings.allow_comments) {
            output('');
            return;
        }

        //TODO [1.0] move this out of here.
        var ts = new TemplateService();
        ts.load('elements/comments', function (err, commentsContainer) {
            ts.load('elements/comments/comment', function (err, comment) {
                output({commentsContainer: commentsContainer, comment: comment});
            });
        });
    }

    /**
     * Retrieves the necessary user information for a commenter
     *
     * @method getCommentingUser
     * @param {Object} user A user object
     */
    getCommentingUser(user) {
        return {
            photo: user.photo,
            name: this.userService.getFormattedName(user),
            position: user.position
        };
    }

    /**
     * Retrieves the necessary user information for a commenter
     * @deprecated
     * @static
     * @method getCommentingUser
     * @param {Object} user A user object
     */
    static getCommentingUser(user) {
        log.warn('CommentService: Static function getCommentingUser is deprecated.  Create an instance and call it instead');
        var service = new CommentService({});
        return service.getCommentingUser(user);
    }

    /**
     *
     * @static
     * @method
     * @param {Object} context
     * @param {TopicService} service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    static onFormat(context, cb) {
        var dto = context.data;
        dto.article = BaseObjectService.sanitize(dto.article);
        dto.content = BaseObjectService.sanitize(dto.content);
        cb(null);
    }

    /**
     *
     * @static
     * @method
     * @param {Object} context
     * @param {TopicService} service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    static onMerge(context, cb) {
        if (context.isCreate) {
            context.object.article = context.data.article;

            var principal = SecurityService.getPrincipal(context.session);
            context.object.commenter = principal === null ? null : principal[DAO.getIdField()] + '';
        }
        context.object.content = context.data.content;
        cb(null);
    }

    /**
     *
     * @static
     * @method validate
     * @param {Object} context
     * @param {Object} context.data The DTO that was provided for persistence
     * @param {TopicService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    static onValidate(context, cb) {
        context.service.validate(context, cb);
    }

    /**
     * TODO [1.0] change to camelCase property
     * @param contentSettings
     * @param content
     * @returns {number|boolean|*}
     */
    static allowComments (contentSettings, content) {
        return contentSettings.allow_comments && content.allow_comments;
    }
}

//Event Registries
BaseObjectService.on(CommentService.TYPE + '.' + BaseObjectService.FORMAT, CommentService.onFormat);
BaseObjectService.on(CommentService.TYPE + '.' + BaseObjectService.MERGE, CommentService.onMerge);
BaseObjectService.on(CommentService.TYPE + '.' + BaseObjectService.VALIDATE, CommentService.onValidate);

//exports
module.exports = CommentService;
