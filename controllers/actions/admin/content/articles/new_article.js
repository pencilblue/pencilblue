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

//dependencies
var BaseController = pb.BaseController;
var FormController = pb.FormController;

function NewArticlePostController(){}

//inheritance
util.inherits(NewArticlePostController, FormController);

NewArticlePostController.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;

	delete post.section_search;
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

    post.author         = this.session.authentication.user_id;
    post.publish_date   = new Date(post.publish_date);

    this.setFormFieldValues(post);

    var message = this.hasRequiredParams(post, this.getRequiredFields());
    if(message) {
        this.formError(message, '/admin/content/articles/new_article', cb);
        return;
    }

    post = pb.DocumentCreator.formatIntegerItems(post, ['draft']);
    var articleDocument = pb.DocumentCreator.create('article', post, ['meta_keywords', 'article_sections', 'article_topics', 'article_media']);
    pb.RequestHandler.isSystemSafeURL(articleDocument.url, null, function(err, isSafe) {
        if(util.isError(err) || !isSafe)  {
            self.formError(self.ls.get('EXISTING_URL'), '/admin/content/articles/new_article', cb);
            return;
        }

        var dao = new pb.DAO();
        dao.update(articleDocument).then(function(result) {
            if(util.isError(result))  {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/articles/new_article', cb);
                return;
            }

            self.session.success = articleDocument.headline + ' ' + self.ls.get('CREATED');
            delete self.session.fieldValues;
            self.redirect('/admin/content/articles/edit_article/' + result._id, cb);
        });
    });
};

NewArticlePostController.prototype.getRequiredFields = function() {
	return ['url', 'headline', 'article_layout'];
};

NewArticlePostController.prototype.getSanitizationRules = function() {
    return {
        article_layout: BaseController.getContentSanitizationRules()
    };
};

//exports
module.exports = NewArticlePostController;
