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
     * Creates a new article
     * @deprecated Since 0.5.0
     */
    function NewArticlePostController(){}
    util.inherits(NewArticlePostController, pb.BaseAdminController);

    NewArticlePostController.prototype.render = function(cb) {
        var self = this;

        this.getJSONPostParams(function(err, post) {
            if(self.session.authentication.user.admin < pb.SecurityService.ACCESS_EDITOR || !post.author) {
              post.author = self.session.authentication.user[pb.DAO.getIdField()];
            }

            post.publish_date = new Date(parseInt(post.publish_date));
            delete post[pb.DAO.getIdField()];

            var message = self.hasRequiredParams(post, self.getRequiredFields());
            if (message) {
                return cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
                });
            }

            post = pb.DocumentCreator.formatIntegerItems(post, ['draft']);
            var articleDocument = pb.DocumentCreator.create('article', post, ['meta_keywords']);
            pb.RequestHandler.isSystemSafeURL(articleDocument.url, null, self.site, function(err, isSafe) {
                if(util.isError(err) || !isSafe)  {
                    cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('EXISTING_URL'))
                    });
                    return;
                }

                self.siteQueryService.save(articleDocument, function(err, result) {
                    if(util.isError(err))  {
                        return cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('ERROR_SAVING'))
                        });
                    }

                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, articleDocument.headline + ' ' + self.ls.get('CREATED'), result)});
                });
            });
        });
    };

    NewArticlePostController.prototype.getRequiredFields = function() {
        return ['url', 'headline', 'article_layout'];
    };

    NewArticlePostController.prototype.getSanitizationRules = function() {
        return {
            article_layout: pb.BaseController.getContentSanitizationRules()
        };
    };

    //exports
    return NewArticlePostController;
};
