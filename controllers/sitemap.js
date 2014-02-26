/**
 * SiteMap - 
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function SiteMap(){}

//inheritance
util.inherits(SiteMap, pb.BaseController);

SiteMap.prototype.render = function(cb) {
	var self = this;
	
	pb.templates.load('xml_feeds/sitemap', null, null, function(result) {        
        pb.templates.load('xml_feeds/sitemap/url', null, null, function(urlTemplate) {         
            
        	var dao   = new pb.DAO();
        	var tasks = [
	             function(callback) {
	            	 dao.query('section', pb.DAO.ANYWHERE, {url: 1, last_modified: 1}).then(function(sections) {
	            		callback(null, self.processObjects(sections, urlTemplate, '/', '0.5')); 
	            	 });
	             },
	             function(callback) {
	            	 dao.query('page', {publish_date: {$lte: new Date()}}, {url: 1, last_modified: 1}).then(function(sections) {
	            		callback(null, self.processObjects(sections, urlTemplate, '/page/', '1.0')); 
	            	 });
	             },
	             function(callback) {
	            	 dao.query('article', {publish_date: {$lte: new Date()}}, {url: 1, last_modified: 1}).then(function(sections) {
	            		callback(null, self.processObjects(sections, urlTemplate, '/page/', '1.0')); 
	            	 });
	             },
            ];
        	async.parallelLimit(tasks, 2, function(err, htmlParts) {
        		
        		var urlHTML = htmlParts.join('');
        		result      = result.split('^urls^').join(urlHTML);
        		cb({content: result});
        	}); 
        });
    });
};

SiteMap.prototype.processObjects = function(objArray, template, urlPrefix, priority) {
	var urls = '';
	for(var i = 0; i < objArray.length; i++) {
        var url = template.split('^url^').join(urlPrefix + objArray[i].url)
        	.split('^last_mod^').join(this.getLastModDate(objArray[i].last_modified))
        	.split('^change_freq^').join('daily')
        	.split('^priority^').join(priority);
        
        urls = urls.concat(url);
    }
	return urls;
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
