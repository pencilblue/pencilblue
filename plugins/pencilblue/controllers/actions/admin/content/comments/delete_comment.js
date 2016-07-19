/*
    Copyright (C) 2016  PencilBlue, LLC

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
'use strict';

module.exports = function DeleteCommentModule(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Deletes a comment
     */
    function DeleteComment(){}
    util.inherits(DeleteComment, pb.BaseController);

    DeleteComment.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        //verify that the ID is a valid format
        if (!pb.validation.isIdStr(vars.id, true)) {
            return cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INVALID_UID'))
            });
        }

        //verify that the comment exists
        var dao = new pb.DAO();
        dao.loadById(vars.id, 'comment', function(err, comment) {
            if(util.isError(err)) {
                return self.reqHandler.serveError(err);
            }
            else if (!comment) {
                return cb({
                    code: 404,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INVALID_UID'))
                });
            }

            //delete it
            dao.deleteById(vars.id, 'comment', function(err, recordsDeleted) {
                if(util.isError(err)) {
                    return cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_DELETING'))
                    });
                }

                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.g('generic.COMMENT') + ' ' + self.ls.g('admin.DELETED'))});
            });
        });
    };

    //exports
    return DeleteComment;
};
