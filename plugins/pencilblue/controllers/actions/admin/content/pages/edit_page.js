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
 * Edits a page
 * @cclass EditPagePostController
 * @constructor
 * @extends FormController
 */
function EditPagePostController(){}

//inheritance
util.inherits(EditPagePostController, pb.BaseController);

EditPagePostController.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;

	this.getJSONPostParams(function(err, post) {
	    post.publish_date = new Date(parseInt(post.publish_date));
		post.id = vars.id;
		delete post._id;

		var message = self.hasRequiredParams(post, self.getRequiredParams());
	    if(message) {
	        cb({
				code: 400,
				content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
			});
	        return;
	    }

	    var dao = new pb.DAO();
	    dao.loadById(post.id, 'page', function(err, page) {
	        if(util.isError(err) || page === null) {
	            cb({
					code: 400,
					content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('INVALID_UID'))
				});
	            return;
	        }

	        post.author = page.author;
	        post = pb.DocumentCreator.formatIntegerItems(post, ['draft']);
	        pb.DocumentCreator.update(post, page, ['meta_keywords']);

	        self.setFormFieldValues(post);

	        pb.RequestHandler.urlExists(page.url, post.id, function(err, exists) {
	            if(util.isError(err) || exists) {
	                cb({
						code: 400,
						content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('EXISTING_URL'))
					});
	                return;
	            }

	            dao.save(page, function(err, result) {
	                if(util.isError(err)) {
                        pb.log.error(err.stack);
	                    return cb({
							code: 500,
							content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('ERROR_SAVING'), result)
						});
	                }

					post.last_modified = new Date();
					cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, page.headline + ' ' + self.ls.get('EDITED'), post)});
	            });
	        });
	    });
	});
};

EditPagePostController.prototype.getRequiredParams = function() {
	return ['url', 'headline', 'page_layout', 'id'];
};

EditPagePostController.prototype.getSanitizationRules = function() {
    return {
        page_layout: pb.BaseController.getContentSanitizationRules()
    };
};

//exports
module.exports = EditPagePostController;
