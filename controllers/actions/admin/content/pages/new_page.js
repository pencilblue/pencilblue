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
 * Creates a new page
 * @class NewPagePostController
 * @constructor
 * @extends FormController
 */
function NewPagePostController(){}

//inheritance
util.inherits(NewPagePostController, pb.FormController);

NewPagePostController.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;

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

    post.author       = self.session.authentication.user_id;
    post.publish_date = new Date(post.publish_date);

    this.setFormFieldValues(post);

    var message = this.hasRequiredParams(post, ['url', 'headline', 'page_layout']);
    if(message) {
        this.formError(message, '/admin/content/pages/new_page', cb);
        return;
    }

    post = pb.DocumentCreator.formatIntegerItems(post, ['draft']);
    var pageDocument = pb.DocumentCreator.create('page', post, ['meta_keywords', 'page_topics', 'page_media']);
    var dao          = new pb.DAO();
    dao.count('page', {url: pageDocument.url}, function(err, count) {
        if(util.isError(err) || count > 0) {
            self.formError(self.ls.get('EXISTING_URL'), '/admin/content/pages/new_page', cb);
            return;
        }

        dao.count('article', {url: pageDocument.url}, function(err, count) {
        	if(util.isError(err) || count > 0) {
                self.formError(self.ls.get('EXISTING_URL'), '/admin/content/pages/new_page', cb);
                return;
            }

        	dao.update(pageDocument).then(function(result) {
                if(util.isError(result)) {
                    self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/pages/new_page', cb);
                    return;
                }

                self.session.success = pageDocument.headline + ' ' + self.ls.get('CREATED');
                delete self.session.fieldValues;
                self.redirect('/admin/content/pages/edit_page/' + result._id, cb);
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
module.exports = NewPagePostController;
