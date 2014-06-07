/**
 * DeleteComment - Deletes comment
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function DeleteComment(){}

//inheritance
util.inherits(DeleteComment, pb.FormController);

DeleteComment.prototype.onPostParamsRetrieved = function(post, cb) {
    var self = this;
    var vars = this.pathVars;

    var message = this.hasRequiredParams(vars, ['id']);
    if(message) {
        this.formError(message, '/admin/content/comments/manage_comments', cb);
        return;
    }

    var dao = new pb.DAO();
    dao.query('comment', {_id: ObjectID(vars.id)}).then(function(commentData) {
        if(util.isError(commentData) || commentData.length === 0) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/comments/manage_comments', cb);
            return;
        }

        dao.deleteById(vars.id, 'comment').then(function(recordsDeleted) {
            if(recordsDeleted <= 0) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/comments/manage_comments', cb);
                return;
            }

            self.session.success = self.ls.get('COMMENT') + ' ' + self.ls.get('DELETED');
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/comments/manage_comments'));
        });
    });
};

//exports
module.exports = DeleteComment;
