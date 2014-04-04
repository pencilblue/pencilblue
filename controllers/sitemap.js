/**
 * SiteMap - 
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
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
            	 dao.query('section', pb.DAO.ANYWHERE, {url: 1, last_modified: 1}).then(function(sections) {
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
    		cb(err, htmlParts.join(''));
    	});
	});
	this.ts.load('xml_feeds/sitemap', function(err, result) {        
        cb({content: result});
    });
};

SiteMap.prototype.processObjects = function(objArray, urlPrefix, priority, cb) {
	var self = this;
	var ts   = new pb.TemplateService(this.ls);
	ts.registerLocal('change_freq', 'daily');
	ts.registerLocal('priority', priority);
	
	
	var tasks = pb.utils.getTasks(objArray, function(objArray, i) {
		return function(callback) {
			
			ts.registerLocal('url', urlPrefix + objArray[i].url);
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
