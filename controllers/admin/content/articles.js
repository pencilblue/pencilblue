/**
 * Articles - Articles administration page
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Articles(){}

//inheritance
util.inherits(Articles, pb.BaseController);

Articles.prototype.render = function(cb) {
	cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/articles/manage_articles'));
};

//exports
module.exports = Articles;
