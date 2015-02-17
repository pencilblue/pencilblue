/*
    Copyright (C) 2015  PencilBlue, LLC

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

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Deletes an article
     * @class DeleteArticleActionController
     * @constructor
     */
    function DeleteArticleActionController(){}
    util.inherits(DeleteArticleActionController, pb.BaseController);

    DeleteArticleActionController.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        if (!pb.validation.isIdStr(vars.id, true)) {
            return cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
            });
        }

        var dao = new pb.DAO();
        dao.loadById(vars.id, 'article', function(err, article) {
            var isError = util.isError(err);
            if(isError || !article) {
                return cb({
                    code: isError ? 500 : 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, isError ? err.stack : self.ls.get('INVALID_UID'))
                });
            }

            dao.deleteById(vars.id, 'article', function(err, articlesDeleted) {
                if(util.isError(err) || articlesDeleted <= 0) {
                    return cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_DELETING'))
                    });
                }

                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, article.headline + ' ' + self.ls.get('DELETED'))});
            });
        });
    };

    //exports
    return DeleteArticleActionController;
};
