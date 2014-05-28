/**
 * Article - Responsible for looking up a specific article and rendering it.
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function Article(){}

//dependencies
var Index = require('./index.js');

//inheritance 
util.inherits(Article, Index);


Article.prototype.render = function(cb) {
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
			pb.log.silly("ArticleController: The custom URL was not an object ID [%s].  Will now search url field. [%s]", custUrl, e.message);
		}
	}

	// fall through to URL key
	if (where === null) {
		where = {url: custUrl};
	}
	
	//attempt to load object
	var dao = new pb.DAO();
	dao.loadByValues(where, 'article', function(err, article) {
		if (util.isError(err) || article == null) {
			self.reqHandler.serve404();
			return;
		}
		else if (doRedirect) {
			self.redirect(pb.UrlService.urlJoin('/article', article.url), cb);
			return;
		}
		
		self.req.pencilblue_article = article._id.toString();
		this.article = article; 
		Article.super_.prototype.render.apply(self, [cb]);
	});
};

Article.prototype.getPageTitle = function() {
	return article.name;
};

//exports
module.exports = Article;
