/*
    Copyright (C) 2014  PencilBlue, LLC

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

/**
 * Google sitemap
 */

function SiteMap(){}

//inheritance
util.inherits(SiteMap, pb.BaseController);

//constants
var PARALLEL_LIMIT = 2;

SiteMap.prototype.render = function(cb) {
	var self = this;

	this.ts.registerLocal('urls', function(flag, cb) {

		var dao   = new pb.DAO();
		var today = new Date();
    	var tasks = [
             function(callback) {
            	 var where = {
            	     type: {$ne: 'container'}
            	 }
            	 dao.query('section', where, {url: 1, last_modified: 1, type: 1}).then(function(sections) {
            		self.processObjects(sections, '/', '0.5', callback);
            	 });
             },
             function(callback) {
            	 dao.query('page', {publish_date: {$lte: today}}, {url: 1, last_modified: 1}).then(function(sections) {
            		self.processObjects(sections, '/page/', '1.0', callback);
            	 });
             },
             function(callback) {
            	 dao.query('article', {publish_date: {$lte: today}}, {url: 1, last_modified: 1}).then(function(sections) {
            		self.processObjects(sections, '/article/', '1.0', callback);
            	 });
             },
        ];
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


	var tasks = pb.utils.getTasks(objArray, function(objArray, i) {
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
module.exports = SiteMap;
