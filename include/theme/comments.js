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
var util  = require('../util.js');
var async = require('async');
var registered = false;

/**
 * Theme content services
 *
 * @module Services
 * @submodule Theme
 */
module.exports = function CommentServiceModule(pb) {

    //pb dependencies
    var BaseObjectService = pb.BaseObjectService;
    var ValidationService = pb.ValidationService;

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
    function CommentService(context){
        if (!util.isObject(context)) {
            context = {};
        }

        context.type = TYPE;
        CommentService.super_.call(this, context);

        /**
         *
         * @property userService
         * @type {UserService}
         */
        this.userService = new pb.UserService(context);

        /**
         *
         * @property articleService
         * @type {ArticleService}
         */
        this.articleService = new pb.ArticleServiceV2(context);

        /**
         *
         * @property contentService
         * @type {ContentService}
         */
        this.contentService = new pb.ContentService(context);
    }
    util.inherits(CommentService, BaseObjectService);

    /**
     * @private
     * @static
     * @readonly
     * @property TYPE
     * @type {String}
     */
    var TYPE = 'comment';

    /**
     * Validates a comment
     * @method validate
     * @param {Object} context
     * @param {Function} cb
     */
    CommentService.prototype.validate = function(context, cb) {
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

        var principal = pb.SecurityService.getPrincipal(context.session);
        var isAdmin = pb.SecurityService.isAuthorized(context.session, {admin_level: pb.SecurityService.ACCESS_ADMINISTRATOR});

        if (!ValidationService.isIdStr(obj.commenter)) {
            errors.push(BaseObjectService.validationFailure('commenter', 'An invalid commenter ID was provided'));
        }
        else if (context.isUpdate) {

            if (obj.commenter === null && !isAdmin) {

                //you can't edit an anonymous comment unless you are an admin
                errors.push(BaseObjectService.validationFailure('commenter', 'Only admins can edit anonymous comments'));
            }
            else if (principal && obj.commenter !== principal[pb.DAO.getIdField()].toString() && !isAdmin) {

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
            function(callback) {
                if (!ValidationService.isIdStr(obj.commenter, true)) {
                    return callback();
                }

                //check for existence of user
                self.userService.get(obj.commenter, function(err, user) {
                    if (!util.isObject(user)) {
                        errors.push(BaseObjectService.validationFailure('commenter', 'An invalid  commenter ID was provided'));
                    }
                    callback(err);
                });
            },


            //validate article exists
            function(callback) {

                //retrieve the article to ensure it exists
                self.articleService.get(obj.article, function(err, article) {
                    if (!util.isObject(article)) {
                        errors.push(BaseObjectService.validationFailure('article', 'An invalid article ID was provided'));
                        return callback(err);
                    }

                    //ensure the article supports comments
                    if (!article.allow_comments) {
                        errors.push(BaseObjectService.validationFailure('article', 'The specified article does not allow comments'));
                        return callback(err);
                    }

                    //ensure the site supports comments
                    self.contentService.get(function(err, settings) {
                        if (util.isObject(settings) && !settings.allow_comments) {
                            errors.push(BaseObjectService.validationFailure('article', 'Comments are not enabled'));
                        }
                        return callback(err);
                    });
                });
            }
        ];
        async.parallel(tasks, cb);
    };

    /**
     * Retrieves the template for comments
     *
     * @method getCommentsTemplates
     * @param {Object} contentSettings The content settings to use with retrieval
     * @param {Function} output        Callback function
     */
    CommentService.getCommentsTemplates = function(contentSettings, output) {
        var self = this;

        if(!contentSettings.allow_comments) {
            output('');
            return;
        }

        //TODO move this out of here.
        var ts = new pb.TemplateService();
        ts.load('elements/comments', function(err, commentsContainer) {
            ts.load('elements/comments/comment', function(err, comment) {
                output({commentsContainer: commentsContainer, comment: comment});
            });
        });
    };

    /**
     * Retrieves the necessary user information for a commenter
     *
     * @method getCommentingUser
     * @param {Object} user A user object
     */
    CommentService.prototype.getCommentingUser = function(user) {
        return {
            photo: user.photo,
            name: this.userService.getFormattedName(user),
            position: user.position
        };
    };

    /**
     * Retrieves the necessary user information for a commenter
     * @static
     * @method getCommentingUser
     * @param {Object} user A user object
     */
    CommentService.getCommentingUser = function(user) {
        pb.log.warn('CommentService: Static function getCommentingUser is deprecated.  Create an instance and call it instead');
        var service = new CommentService({});
        return service.getCommentingUser(user);
    };

    /**
     *
     * @static
     * @method
     * @param {Object} context
     * @param {TopicService} service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    CommentService.format = function(context, cb) {
        var dto = context.data;
        dto.article = BaseObjectService.sanitize(dto.article);
        dto.content = BaseObjectService.sanitize(dto.content);
        cb(null);
    };

    /**
     *
     * @static
     * @method
     * @param {Object} context
     * @param {TopicService} service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    CommentService.merge = function(context, cb) {
        if (context.isCreate) {
            context.object.article = context.data.article;

            var principal = pb.SecurityService.getPrincipal(context.session);
            context.object.commenter = principal === null ? null : principal[pb.DAO.getIdField()] + '';
        }
        context.object.content = context.data.content;
        cb(null);
    };

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
    CommentService.validate = function(context, cb) {
        context.service.validate(context, cb);
    };

    //Event Registries
    BaseObjectService.on(TYPE + '.' + BaseObjectService.FORMAT, CommentService.format);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.MERGE, CommentService.merge);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.VALIDATE, CommentService.validate);

    //exports
    return CommentService;
};
