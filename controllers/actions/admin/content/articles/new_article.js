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
 * Creates a new article
 */

function NewArticlePostController(){}

//inheritance
util.inherits(NewArticlePostController, pb.BaseController);

NewArticlePostController.prototype.render = function(cb) {
	var self = this;

	this.getJSONPostParams(function(err, post) {
		post.author       = self.session.authentication.user_id;
		post.publish_date = new Date(parseInt(post.publish_date));
		delete post._id;

		var message = self.hasRequiredParams(post, self.getRequiredFields());
		if (message) {
			cb({
				code: 400,
				content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
			});
			return;
		}

	    post = pb.DocumentCreator.formatIntegerItems(post, ['draft']);
	    var articleDocument = pb.DocumentCreator.create('article', post, ['meta_keywords']);
	    pb.RequestHandler.isSystemSafeURL(articleDocument.url, null, function(err, isSafe) {
	        if(util.isError(err) || !isSafe)  {
				cb({
					code: 400,
					content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('EXISTING_URL'))
				});
	            return;
	        }

	        var dao = new pb.DAO();
	        dao.update(articleDocument).then(function(result) {
	            if(util.isError(result))  {
					cb({
						code: 400,
						content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('ERROR_SAVING'))
					});
	                return;
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
module.exports = NewArticlePostController;
