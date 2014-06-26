/**
 * EditPage - Edits an page
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditPage(){}

//inheritance
util.inherits(EditPage, pb.FormController);

EditPage.prototype.onPostParamsRetrieved = function(post, cb) {
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
    post.page_layout  = decodeURIComponent(post.page_layout);

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
                self.redirect(pb.config.siteRoot + '/admin/content/pages/edit_page/' + post.id, cb);
            });
        });
    });
};

EditPage.prototype.getRequiredParams = function() {
	return ['url', 'headline', 'page_layout', 'id'];
};

//exports
module.exports = EditPage;
