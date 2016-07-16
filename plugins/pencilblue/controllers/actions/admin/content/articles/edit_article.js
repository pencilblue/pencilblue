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
     * Edits an article
     * @deprecated Since 0.5.0
     */
    function EditArticle(){}
    util.inherits(EditArticle, pb.BaseAdminController);

    EditArticle.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        this.getJSONPostParams(function(err, post) {
            post.publish_date = new Date(parseInt(post.publish_date));
            post.id = vars.id;
            delete post[pb.DAO.getIdField()];

            var message = self.hasRequiredParams(post, self.getRequiredFields());
            if (message) {
                return cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
                });
            }

            self.siteQueryService.loadById(post.id, 'article', function(err, article) {
                if(util.isError(err) || article === null) {
                    return cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INVALID_UID'))
                    });
                }

                //TODO should we keep track of contributors (users who edit)?
                if(self.session.authentication.user.admin < pb.SecurityService.ACCESS_EDITOR || !post.author) {
                  post.author = article.author;
                }
                post = pb.DocumentCreator.formatIntegerItems(post, ['draft']);
                pb.DocumentCreator.update(post, article, ['meta_keywords']);

                pb.RequestHandler.urlExists(article.url, post.id, self.site, function(error, exists) {
                    var testError = (error !== null && typeof error !== 'undefined');

                    if( testError || exists || article.url.indexOf('/admin') === 0) {
                        return cb({
                            code: 400,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INVALID_URL'))
                        });
                    }

                    self.siteQueryService.save(article, function(err, result) {
                        if(util.isError(err)) {
                            return cb({
                                code: 500,
                                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'), result)
                            });
                        }

                        post.last_modified = new Date();
                        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, article.headline + ' ' + self.ls.g('admin.EDITED'), post)});
                    });
                });
            });
        });
    };

    EditArticle.prototype.getRequiredFields = function() {
        return ['url', 'headline', 'article_layout', 'id'];
    };


    EditArticle.prototype.getSanitizationRules = function() {
        return {
            article_layout: pb.BaseController.getContentSanitizationRules()
        };
    };

    //exports
    return EditArticle;
};
