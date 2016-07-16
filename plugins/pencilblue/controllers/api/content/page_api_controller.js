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

module.exports = function(pb) {

    //PB dependencies
    var util            = pb.util;
    var PageService     = pb.PageService;

    /**
     *
     * @class PageApiController
     * @constructor
     * @extends BaseApiController
     */
    function PageApiController(){}
    util.inherits(PageApiController, pb.BaseApiController);

    /**
     * Initializes the controller
     * @method initSync
     * @param {Object} context
     */
    PageApiController.prototype.initSync = function(/*context*/) {

        /**
         *
         * @property service
         * @type {ArticleServiceV2}
         */
        this.service = new PageService(this.getServiceContext());
    };

    /**
     * Process the generic API options as well as the page specific "render" option
     * @method processQuery
     * @return {Object}
     */
    PageApiController.prototype.processQuery = function() {
        var options = PageApiController.super_.prototype.processQuery.apply(this);
        options.render = !!this.query.render; //pass 1 for true, 0 or nothing for false
        if (options.render) {
            options.renderBylines = true
        }
        return options;
    };

    /**
     * Processes the query string to develop the where clause for the query request
     * @method processWhere
     * @param {Object} q The hash of all query parameters from the request
     * @return {Object}
     */
    PageApiController.prototype.processWhere = function(q) {
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
            where.page_topics = topicId;
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

    //exports
    return PageApiController;
};
