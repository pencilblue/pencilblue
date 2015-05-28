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
var async = require('async');

module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;

    /**
     * Google sitemap
     */
    function SiteMap(){}
    util.inherits(SiteMap, pb.BaseController);

    //constants
    var PARALLEL_LIMIT = 2;

    SiteMap.prototype.render = function(cb) {
        var self = this;

        this.ts.registerLocal('urls', function(flag, cb) {

            var dao   = new pb.DAO();
            var today = new Date();
            var descriptors = {
                section: {
                    where: {type: {$ne: 'container'}},
                    weight: '0.5',
                    path: '/'
                },
                page: {
                    where: {publish_date: {$lte: today}, draft: {$ne: 1}},
                    weight: '1.0',
                    path: '/page/'
                },
                article: {
                    where: {publish_date: {$lte: today}, draft: {$ne: 1}},
                    weight: '1.0',
                    path: '/article/'
                }
            };
            var tasks = util.getTasks(Object.keys(descriptors), function(keys, i) {
                return function(callback) {
                    var data = descriptors[keys[i]];
                    data.select = {url: 1, last_modified: 1};
                    dao.q(keys[i], data, function(err, items) {
                        self.processObjects(items, data.path, data.weight, callback);
                    });
                };    
            });
            async.parallelLimit(tasks, 2, function(err, htmlParts) {
                cb(err, new pb.TemplateValue(htmlParts.join(''), false));
            });
        });
        this.ts.load('xml_feeds/sitemap', function(err, content) {
            var data = {
                content: content,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            };
            cb(data);
        });
    };

    SiteMap.prototype.processObjects = function(objArray, urlPrefix, priority, cb) {
        var self = this;
        var ts   = new pb.TemplateService(this.ls);
        ts.registerLocal('change_freq', 'daily');
        ts.registerLocal('priority', priority);


        var tasks = util.getTasks(objArray, function(objArray, i) {
            return function(callback) {

                var url;
                if (urlPrefix === '/') {//special case for navItems
                    pb.SectionService.formatUrl(objArray[i]);
                    url = objArray[i].url;
                }
                else {
                    url = pb.UrlService.urlJoin(urlPrefix, objArray[i].url);
                }
                ts.registerLocal('url', url);
                ts.registerLocal('last_mod', self.getLastModDate(objArray[i].last_modified));
                ts.load('xml_feeds/sitemap/url', callback);
            };
        });
        async.series(tasks, function(err, results) {
            cb(err, results.join(''));
        });
    };

    SiteMap.prototype.getLastModDate = function(date) {
        var month = date.getMonth() + 1;
        if(month < 10) {
            month = '0' + month;
        }
        var day = date.getDate();
        if(day < 10) {
            day = '0' + day;
        }

        return date.getFullYear() + '-' + month + '-' + day;
    };

    //exports
    return SiteMap;
};
