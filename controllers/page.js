/**
 * Page - Responsible for looking up a specific page and rendering it.
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function Page(){}

//dependencies
var Index = require('./index.js');

//inheritance 
util.inherits(Page, Index);


Page.prototype.render = function(cb) {
	var self    = this;
	var custUrl = this.pathVars.customUrl;
	var dao     = new pb.DAO();
	dao.loadByValue('url', custUrl, 'page', function(err, page) {
		if (util.isError(err) || page == null) {
			cb({content: 'The section could not be found on this server', code: 404});
			return;
		}
		
		self.req.pencilblue_page = page._id.toString();
		this.page = page; 
		Page.super_.prototype.render.apply(self, [cb]);
	});
};

Page.prototype.getPageTitle = function() {
	return page.headline;
};

//exports
module.exports = Page;