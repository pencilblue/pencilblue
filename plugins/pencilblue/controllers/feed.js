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
var path           = require('path');
var HtmlEncoder    = require('htmlencode');
var async          = require('async');

module.exports = function FeedModule(pb) {

    //pb dependencies
    var util             = pb.util;
    var ArticleServiceV2 = pb.ArticleServiceV2;
    var MediaLoader      = pb.MediaLoader;
    var UrlService       = pb.UrlService;

    /**
     * RSS Feed
     */
    function ArticleFeed(){}
    util.inherits(ArticleFeed, pb.BaseController);

    /**
     * @private
     * @static
     * @property DAYS
     * @type {Array}
     */
    var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    /**
     * @private
     * @static
     * @property MONTHS
     * @type {Array}
     */
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    /**
     * @method init
     * @param {Object} props
     * @param {Function} cb
     */
    ArticleFeed.prototype.init = function(props, cb) {
        var self = this;
        var init = function(err) {
            if (util.isError(err)) {
                return cb(err);
            }

            //create the service
            self.service = new pb.ArticleServiceV2(self.getServiceContext());

            cb(null, true);
        };
        ArticleFeed.super_.prototype.init.apply(this, [props, init]);
    };

    /**
     * @method render
     * @param {Function} cb
     */
    ArticleFeed.prototype.render = function(cb) {
        var self = this;

        this.ts.registerModel({
            feed_url: UrlService.createSystemUrl(self.req.url),
            language: pb.config.defaultLanguage ? pb.config.defaultLanguage : 'en-us',
            last_build: ArticleFeed.getRSSDate(),
            items: function(flag, cb){
                self.processItems(cb);
            }
        });
        this.ts.load('xml_feeds/rss', function(err, content) {
            var data = {
                content: content,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            };
            cb(data);
        });
    };

    /**
     * Builds the content
     * @method processItems
     */
    ArticleFeed.prototype.processItems = function(cb) {
        var self = this;

        var tasks = [

            //retrieve articles
            function(callback) {
                var opts = {
                    render: true,
                    order: [['publish_date', pb.DAO.DESC]],
                    limit: 100
                };
                self.service.getPublished(opts, callback);
            },

            //get section names
            function(articles, callback) {
                self.getSectionNames(articles, callback);
            },

            //serialize articles
            function(articles, callback) {
                self.serializeArticles(articles, callback);
            }
        ];
        async.waterfall(tasks, cb);
    };

    /**
     * @method serializeArticles
     * @param {Array} articles
     * @param {Function} cb
     */
    ArticleFeed.prototype.serializeArticles = function(articles, cb) {
        var self = this;

        var urlOptions = {
            locale: this.ls.language
        };
        var tasks = util.getTasks(articles, function(articles, i) {
            return function(callback) {

                var url = UrlService.createSystemUrl(UrlService.urlJoin('/article', articles[i].url), urlOptions);
                var ts = self.ts.getChildInstance();
                ts.registerLocal('url', url);
                ts.registerLocal('title', articles[i].headline);
                ts.registerLocal('pub_date', ArticleFeed.getRSSDate(articles[i].publish_date));
                ts.registerLocal('author', articles[i].author_name);
                ts.registerLocal('description', new pb.TemplateValue(articles[i].meta_desc ? articles[i].meta_desc : articles[i].subheading, false));
                ts.registerLocal('content', new pb.TemplateValue(articles[i].layout, false));
                ts.registerLocal('categories', function(flag, onFlagProccessed) {
                    var categories = articles[i].section_names.reduce(function(prev, curr) {
                        return prev + '\n<category>' + HtmlEncoder.htmlEncode(curr) + '</category>';
                    }, '');
                    onFlagProccessed(null, new pb.TemplateValue(categories, false));
                });

                process.nextTick(function() {
                    ts.load('xml_feeds/rss/item', callback);
                });
            };
        });
        async.parallel(tasks, function(err, results) {
            cb(err, new pb.TemplateValue(results.join(''), false));
        });
    };

    /**
     * @method getSectionNames
     * @param {Array} articles
     * @param {Function} cb
     */
    ArticleFeed.prototype.getSectionNames = function(articles, cb) {

        //build query to lookup sections that apply
        var opts = {
            select: {name: 1},
            where: pb.DAO.getIdInWhere(ArticleFeed.getDistinctSections(articles)),
            order: [['parent', 1]]
        };
        var dao = new pb.DAO();
        dao.q('section', opts, function(err, sections) {
            if (util.isError(err)) {
                return cb(err);
            }

            //convert to hash for quick lookup
            var idField = pb.DAO.getIdField();
            var sectionsHash = util.arrayToHash(sections, function(sections, i) {
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

            cb(null, articles);
        });
    };

    /**
     * @static
     * @method getDistinctSections
     * @param {Array} articles
     * @return {Array}
     */
    ArticleFeed.getDistinctSections = function(articles) {

        var sectionsHash = {};
        articles.forEach(function(article) {
            if (util.isArray(article.article_sections) && article.article_sections.length > 0) {
                article.article_sections.forEach(function(sectionId) {
                    sectionsHash[sectionId] = true;
                });
            }
        });
        return Object.keys(sectionsHash);
    };

    /**
     * Ex: Thu, 03 Jul 2014 18:21:05 +0000
     * @method getRSSDate
     * @param {Date} [date]
     * @return {String}
     */
    ArticleFeed.getRSSDate = function(date) {
        date = date || new Date();
        return DAYS[date.getDay()] + ', ' + zeroNum(date.getDate()) + ' ' + MONTHS[date.getMonth()] + ' ' + date.getFullYear() + ' ' + zeroNum(date.getHours()) + ':' + zeroNum(date.getMinutes()) + ':' + zeroNum(date.getSeconds()) + ' +0000';
    };

    /**
     * @private
     * @method zeroNum
     * @param {Integer} num
     * @return {String}
     */
    function zeroNum(num) {
        return num < 10 ? '0' + num : num.toString();
    }

    //exports
    return ArticleFeed;
};
