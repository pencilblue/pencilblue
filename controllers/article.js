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
	var dao     = new pb.DAO();
	dao.loadByValue('url', custUrl, 'article', function(err, article) {
		if (util.isError(err) || article == null) {
			self.reqHandler.serve404()
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
