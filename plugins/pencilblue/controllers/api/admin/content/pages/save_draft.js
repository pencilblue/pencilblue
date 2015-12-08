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

/**
 * Automatic draft saving of pages
 */
function SavePageDraftController(){}

//inheritance
util.inherits(SavePageDraftController, pb.FormController);

/**
 * Processes the request to persist a draft.  Redirects the request after
 * completion.
 * @see FormController#onPostParamsRetrieved
 * @method onPostParamsRetrieved
 * @param {Object} The posted parameters
 * @param {Function} cb
 */
SavePageDraftController.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var vars = this.pathVars;

    delete post['topic_search'];
    delete post['media_search'];
    delete post['media_url'];
    delete post['media_type'];
    delete post['location'];
    delete post['thumb'];
    delete post['media_topics'];
    delete post['name'];
    delete post['caption'];
    delete post['layout_link_url'];
    delete post['media_position'];
    delete post['media_max_height'];

    post['author']         = this.session.authentication.user_id;
    post['publish_date']   = new Date(post['publish_date']);

    //add vars to post
    util.merge(vars, post);

    var message = this.hasRequiredParams(post, this.getRequiredFields());
    if (message) {
        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)});
        return;
    }

    var dao = new pb.DAO();
    dao.loadById(post.id, 'page', function(err, page) {
        if(util.isError(err) || page == null) {
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'invalid page id')});
            return;
        }

        //TODO should we keep track of contributors (users who edit)?
        post['author']      = page['author'];
        post = pb.DocumentCreator.formatIntegerItems(post, ['draft']);
        pb.DocumentCreator.update(post, page, ['meta_keywords', 'page_topics', 'page_media']);

        pb.RequestHandler.urlExists(page.url, post.id, page.site, function(error, exists) {
            if(error != null || exists || page.url.indexOf('/admin') == 0) {
                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'existing page url')});
                return;
            }

            dao.save(page, function(err, result) {
                if(util.isError(err)) {
                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'database error')});
                    return;
                }

                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'page updated', page)});
            });
        });
    });
};

/**
 * The required parameters
 * @method getRequiredFields
 * @return {Array} Parameter names that must be present in order to pass
 * validation.
 */
SavePageDraftController.prototype.getRequiredFields = function() {
	return ['url', 'headline', 'page_layout', 'id'];
};

/**
 * @see BaseController#getSanitizationRules
 * @method getSanitizationRules
 * @return {Object}
 */
SavePageDraftController.prototype.getSanitizationRules = function() {
    return {
        page_layout: pb.BaseController.getContentSanitizationRules()
    };
};

//exports
module.exports = SavePageDraftController;
