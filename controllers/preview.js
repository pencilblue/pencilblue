/**
 * Preview - Responsible for looking up a specific article and rendering it.
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function Preview(){}

//dependencies
var Index = require('./index.js');

//inheritance 
util.inherits(Preview, Index);


Preview.prototype.render = function(cb) {
	var self    = this;
	var vars    = this.pathVars;
	
	var dao     = new pb.DAO();
	dao.loadById(vars['id'], vars['type'], function(err, item) {
		if (util.isError(err) || item == null) {
			cb({content: 'The section could not be found on this server', code: 404});
			return;
		}
		
		self.req.pencilblue_preview = true;
		switch(vars['type']) {
		    case 'page':
		        self.req.pencilblue_page = item._id.toString();
		        this.page = item;
		        break;
		    case 'article':
		    default:
		        self.req.pencilblue_article = item._id.toString();
		        this.article = item;
		        break;
        }
		Preview.super_.prototype.render.apply(self, [cb]);
	});
};

Preview.prototype.getPageTitle = function() {
	return article.name;
};

//exports
module.exports = Preview;
