/*
    Copyright (C) 2014  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * Deletes a comment
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
            self.redirect('/admin/content/comments/manage_comments', cb);
        });
    });
};

//exports
module.exports = DeleteComment;
