/**
 * Comments - Comments Settings
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Comments(){}

//inheritance
util.inherits(Comments, pb.BaseController);

Comments.prototype.render = function(cb) {
    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/comments/manage_comments'));
};

Comments.getPillNavOptions = function(activePill) {
    return [];
};

//exports
module.exports = Comments;
