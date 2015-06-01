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
    var BaseController  = pb.BaseController;
    var Comments        = pb.CommentService;
    var ArticleService  = pb.ArticleService;
    var IndexController = require('../../index.js')(pb);

    /**
     * Get articles within indices, for real time pagination
     */
    function GetArticles(){}
    util.inherits(GetArticles, IndexController);

    GetArticles.prototype.render = function(cb) {
        var self = this;
        var get  = this.query;

        var contentService = new pb.ContentService(self.site);
        contentService.getSettings(function(err, contentSettings) {

            if(!get.limit || get.limit.length === 0)
            {
                get.limit = contentSettings.articles_per_page;
            }
            if(!get.offset)
            {
                get.offset = contentSettings.articles_per_page;
            }

            self.limit  = parseInt(get.limit);
            self.offset = parseInt(get.offset);

            //create callback to be issued by all the find calls
            var articleCallback = function(err, articles) {
                self.processArticles(articles, cb);
            };

            var service = new ArticleService(self.site, true);

            if(get.section) {
                service.findBySection(get.section, articleCallback);
            }
            else if(get.topic) {
                service.findByTopic(get.topic, articleCallback);
            }
            else {
                service.find({}, articleCallback);
            }
        });
    };

    GetArticles.prototype.processArticles = function(articles, cb) {
        var self = this;

        var contentService = new pb.ContentService(self.site);
        contentService.getSettings(function(err, contentSettings) {

            var cnt   = 0;
            var tasks = util.getTasks(articles, function(content, i) {
                return function(callback) {
                    if (i < self.offset || i >= (self.offset + self.limit)) {//TODO, limit articles in query, not through hackery
                        callback(null, '');
                        return;
                    }
                    cnt++;
                    self.renderContent(content[i], contentSettings, {}, i, callback);
                };
            });
            async.series(tasks, function(err, result) {

                var data   = {count: cnt, articles: result.join('')};
                var apiObj = BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'success', data);
                cb({content: apiObj});
            });
        });
    };

    //exports
    return GetArticles;
};
