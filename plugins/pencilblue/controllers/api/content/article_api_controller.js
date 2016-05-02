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

module.exports = function(pb) {

    //PB dependencies
    var util              = pb.util;
    var ArticleServiceV2  = pb.ArticleServiceV2;
    var BaseObjectService = pb.BaseObjectService;
    var CommentService    = pb.CommentService;

    /**
     *
     * @class ArticleApiController
     * @constructor
     * @extends BaseApiController
     */
    function ArticleApiController(){}
    util.inherits(ArticleApiController, pb.BaseApiController);

    /**
     * Initializes the controller
     * @method initSync
     * @param {Object} context
     */
    ArticleApiController.prototype.initSync = function(/*context*/) {

        /**
         *
         * @property service
         * @type {ArticleServiceV2}
         */
        this.service = new ArticleServiceV2(this.getServiceContext());

        /**
         *
         * @property commentService
         * @type {CommentService}
         */
        this.commentService = new CommentService(this.getServiceContext());
    };

    /**
     * Process the generic API options as well as the article specific "render" option
     * @method processQuery
     * @return {Object}
     */
    ArticleApiController.prototype.processQuery = function() {
        var options = ArticleApiController.super_.prototype.processQuery.apply(this);
        options.render = BaseObjectService.parseBoolean(this.query.render);
        return options;
    };

    /**
     * Processes the query string to develop the where clause for the query request
     * @method processWhere
     * @param {Object} q The hash of all query parameters from the request
     * @return {Object}
     */
    ArticleApiController.prototype.processWhere = function(q) {
        var where = null;
        var failures = [];

        //build query & get results
        var search = q.q;
        if (pb.ValidationService.isNonEmptyStr(search, true)) {

            var patternStr = ".*" + util.escapeRegExp(search) + ".*";
            var pattern = new RegExp(patternStr, "i");
            where = {
                $or: [
                    {headline: pattern},
                    {subheading: pattern}
                ]
            };
        }

        //search by topic
        var topicId = q.topic;
        if (pb.ValidationService.isIdStr(topicId, true)) {
            where = where || {};
            where.article_topics = topicId;
        }

        //search by author
        var authorId = q.author;
        if (pb.ValidationService.isIdStr(authorId, true)) {
            where = where || {};
            where.author = authorId;
        }

        return {
            where: where,
            failures: failures
        };
    };

    /**
     * Retrieves comments for an article
     * @method getAllComments
     * @param {Function} cb
     */
    ArticleApiController.prototype.getAllComments = function(cb) {
        var options = this.processQuery();
        options.where.article = this.pathVars.articleId;
        this.commentService.getAllWithCount(options, this.handleGet(cb));
    };

    /**
     * Adds a comment to an article
     * @method addComment
     * @param {Function} cb
     */
    ArticleApiController.prototype.addComment = function(cb) {
        var dto = this.getPostDto();
        dto.article = this.pathVars.articleId;
        this.commentService.save(dto, this.handleSave(cb, true));
    };

    /**
     * Deletes a comment from an article
     * @method deleteComment
     * @param {Function} cb
     */
    ArticleApiController.prototype.deleteComment = function(cb) {
        var id = this.pathVars.id;
        this.commentService.deleteById(id, this.handleDelete(cb));
    };

    //exports
    return ArticleApiController;
};
