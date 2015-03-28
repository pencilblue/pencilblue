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
     * Creates a new page
     * @class NewPagePostController
     * @constructor
     * @extends FormController
     */
    function NewPagePostController(){}
    util.inherits(NewPagePostController, pb.BaseController);

    NewPagePostController.prototype.render = function(cb) {
        var self = this;

        this.getJSONPostParams(function(err, post) {
            if(self.session.authentication.user.admin < pb.SecurityService.ACCESS_EDITOR || !post.author) {
              post.author = self.session.authentication.user[pb.DAO.getIdField()];
            }

            post.publish_date = new Date(parseInt(post.publish_date));
            delete post[pb.DAO.getIdField()];

            var message = self.hasRequiredParams(post, ['url', 'headline', 'page_layout']);
            if(message) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
                });
                return;
            }

            post = pb.DocumentCreator.formatIntegerItems(post, ['draft']);
            var pageDocument = pb.DocumentCreator.create('page', post, ['meta_keywords']);
            var dao          = new pb.DAO();
            dao.count('page', {url: pageDocument.url}, function(err, count) {
                if(util.isError(err) || count > 0) {
                    cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('EXISTING_URL'))
                    });
                    return;
                }

                dao.count('article', {url: pageDocument.url}, function(err, count) {
                    if(util.isError(err) || count > 0) {
                        cb({
                            code: 400,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('ERROR_SAVING'))
                        });
                        return;
                    }

                    dao.save(pageDocument, function(err, result) {
                        if(util.isError(err)) {
                            cb({
                                code: 500,
                                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('ERROR_SAVING'))
                            });
                            return;
                        }

                        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, pageDocument.headline + ' ' + self.ls.get('CREATED'), result)});
                    });
                });
            });
        });
    };

    NewPagePostController.prototype.getSanitizationRules = function() {
        return {
            page_layout: pb.BaseController.getContentSanitizationRules()
        };
    };

    //exports
    return NewPagePostController;
};
