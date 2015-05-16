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
var path           = require('path');
var HtmlEncoder    = require('htmlencode');
var async          = require('async');
var process        = require('process');

module.exports = function FeedModule(pb) {

    //pb dependencies
    var util             = pb.util;
    var ArticleServiceV2 = pb.ArticleServiceV2;
    var MediaLoader      = pb.MediaLoader;

    /**
     * RSS Feed
     */
    function ArticleFeed(){
        
        /**
         *
         *
         */
        this.service = new ArticleServiceV2();
    }
    util.inherits(ArticleFeed, pb.BaseController);

    ArticleFeed.prototype.render = function(cb) {
        var self = this;

        this.ts.registerLocal('language', pb.config.defaultLanguage ? pb.config.defaultLanguage : 'en-us');
        this.ts.registerLocal('last_build', self.getBuildDate());
        this.ts.registerLocal('items', function(flag, cb){

            var opts = {
                render: true,
                order: {publish_date: pb.DAO.DESC},
                limit: 100
            };
            self.service.getPublished(opts, function(err, articles) {
                if (util.isError(err)) {
                    return cb(err);
                }

                self.getSectionNames(articles, function(err) {
                    if (util.isError(err)) {
                        return cb(err);
                    }

                    var tasks = util.getTasks(articles, function(articles, i) {
                        return function(callback) {

                                self.ts.registerLocal('url', '/article/' + articles[i].url);
                                self.ts.registerLocal('title', articles[i].headline);
                                self.ts.registerLocal('pub_date', ArticleFeed.getRSSDate(articles[i].publish_date));
                                self.ts.registerLocal('author', articles[i].author_name);
                                self.ts.registerLocal('description', new pb.TemplateValue(articles[i].meta_desc ? articles[i].meta_desc : articles[i].subheading, false));
                                self.ts.registerLocal('content', new pb.TemplateValue(articles[i].layout, false));
                                self.ts.registerLocal('categories', function(flag, onFlagProccessed) {
                                    var categories = '';
                                    for(var j = 0; j < articles[i].section_names.length; j++) {
                                        categories = categories.concat('<category>' + HtmlEncoder.htmlEncode(articles[i].section_names[j]) + '</category>');
                                    }
                                    onFlagProccessed(null, new pb.TemplateValue(categories, false));
                                });

                            process.nextTick(function() {
                                self.ts.load('xml_feeds/rss/item', callback);
                            });
                        };
                    });
                    async.series(tasks, function(err, results) {
                        cb(err, new pb.TemplateValue(results.join(''), false));
                    });
                });
            });
        });
        self.ts.load('xml_feeds/rss', function(err, content) {
            var data = {
                content: content,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            };
            cb(data);
        });
    };

    ArticleFeed.prototype.getBuildDate = function() {
        var date = new Date();
        //Thu, 03 Jul 2014 18:21:05 +0000

        var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        this.zeroNum = function(num) {
            if(num < 10) {
                return '0' + num;
            }

            return num.toString();
        };

        return days[date.getDay()] + ', ' + this.zeroNum(date.getDate()) + ' ' + months[date.getMonth()] + ' ' + date.getFullYear() + ' ' + this.zeroNum(date.getHours()) + ':' + this.zeroNum(date.getMinutes()) + ':' + this.zeroNum(date.getSeconds()) + ' +0000';
    };


    ArticleFeed.prototype.getSectionNames = function(articles, cb) {

        //get the sections
        var sectionsHash = {};
        articles.forEach(function(article) {
            if (util.isArray(article.article_sections) && article.article_sections.length > 0) {
                article.article_sections.forEach(function(sectionId) {
                    sectionsHash[sectionId] = true;
                });
            }
        });
        
        //build query to lookup sections that apply
        var opts = {
            select: {name: 1},
            where: pb.DAO.getIdInWhere(Object.keys(sectionsHash)),
            order: {parent: 1}
        };
        var dao = new pb.DAO();
        dao.q('section', opts, function(err, sections) {
            if (util.isError(err)) {
                return cb(err);
            }

            //convert to hash for quick lookup
            var idField = pb.DAO.getIdField();
            sectionsHash = util.arrayToHash(sections, function(sections, i) {
                return sections[i][idField];
            });
            
            //set for each article
            articles.forEach(function(article) {
                article.section_names = [];
                if (!util.isArray(article.article_sections)) {
                    return;
                }
                    
                //add all section names
                article.article_sections.forEach(function(sectionId) {
                    
                    var section = sectionsHash[sectionId];
                    if (section) {
                        article.section_names.push(section.name);
                    }
                });
            });

            cb(null);
        });
    };

    ArticleFeed.getRSSDate = function(date) {

        var dayNames   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        function getTrailingZero(number)  {
            if(number < 10) {
                return '0' + number;
            }
            return number;
        }

        return dayNames[date.getDay()] + ', ' + date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear() + ' ' + getTrailingZero(date.getHours()) + ':' + getTrailingZero(date.getMinutes()) + ':' + getTrailingZero(date.getSeconds()) + ' +0000';
    };

    //exports
    return ArticleFeed;
};
