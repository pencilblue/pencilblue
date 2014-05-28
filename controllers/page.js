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
	
	//check for object ID as the custom URL
	var doRedirect = false;
	var where      = null;
	try {
		where      = {_id: pb.DAO.getObjectID(custUrl)};
		doRedirect = true;
	}
	catch(e){
		if (pb.log.isSilly()) {
			pb.log.silly("PageController: The custom URL was not an object ID [%s].  Will now search url field. [%s]", custUrl, e.message);
		}
	}

	// fall through to URL key
	if (where === null) {
		where = {url: custUrl};
	}
	
	var dao     = new pb.DAO();
	dao.loadByValues(where, 'page', function(err, page) {
		if (util.isError(err) || page == null) {
			cb({content: 'The page could not be found on this server', code: 404});
			return;
		}
		else if (doRedirect) {
			self.redirect(pb.UrlService.urlJoin('/page', page.url), cb);
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