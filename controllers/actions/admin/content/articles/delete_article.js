/**
 * DeleteArticle - Deletes articles
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function DeleteArticle(){}

//inheritance
util.inherits(DeleteArticle, pb.DeleteController);

DeleteArticle.prototype.getFormErrorRedirect = function(err, message) {
	return '/admin/content/articles/manage_articles';
};

DeleteArticle.prototype.getDeleteCollection = function() {
	return 'article';
};

DeleteArticle.prototype.getSuccessRedirect = function() {
	return pb.config.siteRoot + '/admin/content/articles/manage_articles';
};

//exports
module.exports = DeleteArticle;
