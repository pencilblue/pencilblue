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
var ArticleService = require(path.join(pb.config.docRoot, '/include/service/entities/article_service')).ArticleService;
var MediaLoader    = require(path.join(pb.config.docRoot, '/include/service/entities/article_service')).MediaLoader;

/**
 * RSS Feed
 */
function ArticleFeed(){}

//inheritance
util.inherits(ArticleFeed, pb.BaseController);

ArticleFeed.prototype.render = function(cb) {
	var self = this;

	this.ts.registerLocal('language', pb.config.defaultLanguage ? pb.config.defaultLanguage : 'en-us');
    this.ts.registerLocal('last_build', self.getBuildDate());
	this.ts.registerLocal('items', function(flag, cb){

        var opts = {
            select: pb.DAO.PROJECT_ALL,
            where: {publish_date: {$lte: new Date()}},
            order: {publish_date: pb.DAO.DESC},
            limit: 100
        };
        var dao   = new pb.DAO();
        dao.q('article', opts, function(err, articles) {
            if (util.isError(err)) {
                return cb(err);   
            }

			pb.users.getAuthors(articles, function(err, articlesWithAuthorNames) {
	            articles = articlesWithAuthorNames;

	            self.getSectionNames(articles, function(err, articlesWithSectionNames) {
	                articles = articlesWithSectionNames;

	                self.getMedia(articles, function(err, articlesWithMedia) {
	                    articles = articlesWithMedia;



                        var tasks = util.getTasks(articles, function(articles, i) {
                            return function(callback) {

                                self.ts.registerLocal('url', '/article/' + articles[i].url);
                                self.ts.registerLocal('title', articles[i].headline);
                                self.ts.registerLocal('pub_date', ArticleFeed.getRSSDate(articles[i].publish_date));
                                self.ts.registerLocal('author', articles[i].author_name);
                                self.ts.registerLocal('description', new pb.TemplateValue(articles[i].meta_desc ? articles[i].meta_desc : articles[i].subheading, false));
                                self.ts.registerLocal('content', new pb.TemplateValue(articles[i].article_layout, false));
                                self.ts.registerLocal('categories', function(flag, onFlagProccessed) {
                                    var categories = '';
                                    for(var j = 0; j < articles[i].section_names.length; j++) {
                                        categories = categories.concat('<category>' + HtmlEncoder.htmlEncode(articles[i].section_names[j]) + '</category>');
                                    }
                                    onFlagProccessed(null, new pb.TemplateValue(categories, false));
                                });
                                self.ts.load('xml_feeds/rss/item', callback);
                            };
                        });
                        async.series(tasks, function(err, results) {
                            cb(err, new pb.TemplateValue(results.join(''), false));
                        });
                    });
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

    var opts = {
        select: {name: 1},
        where: pb.DAO.ANYWHERE,
        order: {parent: 1}
    };
	var dao = new pb.DAO();
	dao.q('section', opts, function(err, sections) {
        if (util.isError(err)) {
            return cb(err, sections);   
        }

		for(var i = 0; i < articles.length; i++) {

			var sectionNames = [];
            for(var j = 0; j < articles[i].article_sections.length; j++) {

            	for(var o = 0; o < sections.length; o++) {

                	if(pb.DAO.areIdsEqual(sections[o][pb.DAO.getIdField()], articles[i].article_sections[j])) {
                        sectionNames.push(sections[o].name);
                        break;
                    }
                }
            }

            articles[i].section_names = sectionNames;
        }

        cb(null, articles);
    });
};

ArticleFeed.prototype.getMedia = function(articles, cb) {

    var tasks = util.getTasks(articles, function(articles, i) {
    	return function (callback) {

    		var mediaLoader = new MediaLoader();
    	    mediaLoader.start(articles[i].article_layout, function(err, newLayout) {
    	        articles[i].layout = newLayout;
    	        callback(null, articles[i]);
    	    });
    	};
    });
    async.series(tasks, cb);
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
module.exports = ArticleFeed;
