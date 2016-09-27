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

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Creates a new page
     * @deprecated Since 0.5.0
     * @class NewPagePostController
     * @constructor
     * @extends BaseAdminController
     */
    function NewPagePostController(){}
    util.inherits(NewPagePostController, pb.BaseAdminController);

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
            pb.RequestHandler.urlExists(pageDocument.url, post.id, self.site, function(err, exists) {
                if(util.isError(err) || exists) {
                    cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INVALID_URL'))
                    });
                    return;
                }
                self.siteQueryService.save(pageDocument, function(err, result) {
                    if(util.isError(err)) {
                        pb.log.error(err);
                        cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'))
                        });
                        return;
                    }

                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, pageDocument.headline + ' ' + self.ls.g('admin.CREATED'), result)});
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
