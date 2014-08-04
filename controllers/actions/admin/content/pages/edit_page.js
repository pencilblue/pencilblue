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
util.inherits(EditPagePostController, pb.FormController);

EditPagePostController.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var vars = this.pathVars;

	delete post.topic_search;
    delete post.media_search;
    delete post.media_url;
    delete post.media_type;
    delete post.location;
    delete post.thumb;
    delete post.media_topics;
    delete post.name;
    delete post.caption;
    delete post.layout_link_url;
    delete post.layout_link_text;
    delete post.media_position;
    delete post.media_max_height;

    post.author       = self.session.authentication.user_id.toString();
    post.publish_date = new Date(post.publish_date);

    //merge in get params
	pb.utils.merge(vars, post);

	var message = this.hasRequiredParams(post, this.getRequiredParams());
    if(message) {
        this.formError(message, '/admin/content/pages/manage_pages', cb);
        return;
    }

    var dao = new pb.DAO();
    dao.loadById(post.id, 'page', function(err, page) {
        if(util.isError(err) || page === null) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/pages/manage_pages', cb);
            return;
        }

        post.author = page.author;
        post = pb.DocumentCreator.formatIntegerItems(post, ['draft']);
        pb.DocumentCreator.update(post, page, ['meta_keywords', 'page_sections', 'page_topics', 'page_media']);

        self.setFormFieldValues(post);

        pb.RequestHandler.urlExists(page.url, post.id, function(err, exists) {
            if(util.isError(err) || exists) {
                self.formError(self.ls.get('EXISTING_URL'), '/admin/content/pages/edit_page/' + post.id, cb);
                return;
            }

            dao.update(page).then(function(result) {
                if(util.isError(result)) {
                    self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/pages/edit_page/' + post.id, cb);
                    return;
                }

                self.session.success = page.headline + ' ' + self.ls.get('EDITED');
                delete self.session.fieldValues;
                self.redirect('/admin/content/pages/edit_page/' + post.id, cb);
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
