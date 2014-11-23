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
 * Creates a new comment
 */

function NewComment(){}

//dependencies
var BaseController = pb.BaseController;

//inheritance
util.inherits(NewComment, pb.FormController);

NewComment.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;

	pb.content.getSettings(function(err, contentSettings) {
		if(!contentSettings.allow_comments) {
            cb({content: BaseController.apiResponse(BaseController.API_FAILURE, 'commenting not allowed'), code: 400});
            return;
        }

		var message = self.hasRequiredParams(post, ['article', 'content']);
        if (message) {
        	cb({content: BaseController.apiResponse(BaseController.API_FAILURE, 'parameters missing'), code: 400});
            return;
        }

        var dao = new pb.DAO();
        dao.loadById(post.article, 'article', function(err, article) {
            if(util.isError(err) || article == null) {
            	cb({content: BaseController.apiResponse(BaseController.API_FAILURE, 'article does not exist'), code: 400});
                return;
            }

            var commentDocument       = pb.DocumentCreator.create('comment', post);
            commentDocument.commenter = self.session.authentication.user_id;

            dao.update(commentDocument).then(function(data) {
                if (util.isError(data)) {
                	cb({content: BaseController.apiResponse(BaseController.API_FAILURE, 'error saving'), code: 500});
                    return;
                }

                var timestamp  = pb.content.getTimestampTextFromSettings(commentDocument.created, contentSettings);
                commentDocument.timestamp = self.localizationService.localize(['timestamp'], timestamp);
				cb({content: BaseController.apiResponse(BaseController.API_SUCCESS, 'comment created' , commentDocument)});
            });
        });
	});
};

//exports
module.exports = NewComment;
