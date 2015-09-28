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
var path  = require('path');
var async = require('async');

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;
    var BaseController   = pb.BaseController;
    var Comments         = pb.CommentService;
    var ArticleServiceV2 = pb.ArticleServiceV2;

    /**
     * Get articles within indices, for real time pagination
     */
    function GetArticles(){}

    util.inherits(GetArticles, BaseController);

    GetArticles.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {
            if (util.isError(err)) {
                return cb(err);
            }

            //retrieve content settings
            var contentService = new pb.ContentService();
            contentService.getSettings(function(err, contentSettings) {

                //set the content settings
                self.contentSettings = contentSettings;

                //create the service
                var asContext = self.getServiceContext();
                asContext.contentSettings = contentSettings;
                self.service = new pb.ArticleServiceV2(asContext);

                //create the loader context
                var cvlContext  = self.getServiceContext();
                cvlContext.service = self.service;
                cvlContext.contentSettings = contentSettings;
                self.contentViewLoader = new pb.ContentViewLoader(cvlContext);

                //call back
                cb(err, !util.isError(err));
            });
        };
        GetArticles.super_.prototype.init.apply(this, [context, init]);
    };

    GetArticles.prototype.render = function(cb) {
        var self = this;


        this.getContent(function(err, articles) {
            if (util.isError(err)) {
                return cb(err);
            }
            var options = {};
            self.contentViewLoader.onContent(articles, options, function(err, content) {
                if (util.isError(err)) {
                    return cb(err);
                }

                var data = {
                    count: articles.length,
                    articles: content.toString(),
                    limit: self.getLimit(),
                    offset: self.getOffset()
                };
                cb({
                    content: BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'success', data)
                });
            });
        });
    };

    GetArticles.prototype.getOffset = function() {
        var offset = parseInt(this.query.offset);
        if (isNaN(offset) || offset < 0) {

            //the infinite scroll depends on this being the default.  It is old 
            //legacy logic and should not be brought forward as the new new 
            //article API is built out.
            offset = this.contentSettings.articles_per_page;
        }
        return offset;
    };

    GetArticles.prototype.getLimit = function(cb) {
        var limit = parseInt(this.query.limit);
        if (isNaN(limit) || limit <= 0 || limit > this.contentSettings.articles_per_page) {
            limit = this.contentSettings.articles_per_page;
        }
        return limit;
    };

    GetArticles.prototype.getContent = function(cb) {

        var limit  = this.getLimit();
        var offset = this.getOffset();

        //build out the where clause
        var where = {};
        pb.ContentObjectService.setPublishedClause(where);

        if (this.query.section) {
            ArticleServiceV2.setSectionClause(where, this.query.section);
        }
        else if (this.query.topic) {
            ArticleServiceV2.setTopicClause(where, this.query.topic);
        }

        //retrieve articles
        var opts = {
            render: true,
            where: where,
            order: [{'publish_date': pb.DAO.DESC}, {'created': pb.DAO.DESC}],
            limit: limit,
            offset: offset
        };
        this.service.getAll(opts, cb);
    };

    //exports
    return GetArticles;
};
