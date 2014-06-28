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
 * Automatic draft saving of articles
 */

function SaveDraft(){}

//inheritance
util.inherits(SaveDraft, pb.FormController);

SaveDraft.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var vars = this.pathVars;

    delete post['section_search'];
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
    post['article_layout'] = decodeURIComponent(post['article_layout']);

    //add vars to post
    pb.utils.merge(vars, post);

    var message = this.hasRequiredParams(post, this.getRequiredFields());
    if (message) {
        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)});
        return;
    }

    var dao = new pb.DAO();
    dao.loadById(post.id, 'article', function(err, article) {
        if(util.isError(err) || article == null) {
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'invalid article id')});
            return;
        }

        //TODO should we keep track of contributors (users who edit)?
        post['author']      = article['author'];
        post = pb.DocumentCreator.formatIntegerItems(post, ['draft']);
        pb.DocumentCreator.update(post, article, ['meta_keywords', 'article_sections', 'article_topics', 'article_media']);

        pb.RequestHandler.urlExists(article.url, post.id, function(error, exists) {
            if(error != null || exists || article.url.indexOf('/admin') == 0) {
                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'existing article url')});
                return;
            }

            dao.update(article).then(function(result) {
                if(util.isError(result)) {
                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'database error')});
                    return;
                }

                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'article updated', article)});
            });
        });
    });
};

SaveDraft.prototype.getRequiredFields = function() {
	return ['url', 'headline', 'template', 'article_layout', 'id'];
};

//exports
module.exports = SaveDraft;
