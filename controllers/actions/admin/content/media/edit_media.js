/**
 * EditMedia - Adds new media
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditMedia(){}

//inheritance
util.inherits(EditMedia, pb.FormController);

EditMedia.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var vars = this.pathVars;

	delete post.topic_search;

	pb.utils.merge(vars, post);

	var message = this.hasRequiredParams(post, this.getRequiredParams());
    if(message) {
        this.formError(message, this.getFormErrorRedirect(post.id), cb);
        return;
    }

	var dao = new pb.DAO();
	dao.loadById(post.id, 'media', function(err, media) {
    	//TODO handle error

        if(media === null) {
            self.formError(self.ls.get('ERROR_SAVING'), this.getFormErrorRedirect(post.id), cb);
            return;
        }

        //update existing document
        pb.DocumentCreator.update(post, media, ['media_topics'], ['is_file']);
        dao.update(media).then(function(result) {
            if (util.isError(result)) {
                self.formError(self.ls.get('ERROR_SAVING'), self.getFormErrorRedirect(), cb);
                return;
            }

            self.onSaveSuccessful(media);
            cb(self.genReturnVal(result));
        });
    });
};

EditMedia.prototype.onSaveSuccessful = function(mediaDocument) {
	this.session.success = mediaDocument.name + ' ' + this.ls.get('EDITED');
};

EditMedia.prototype.getRequiredParams = function() {
	return ['media_type', 'location', 'name'];
};

EditMedia.prototype.getFormErrorRedirect = function(id){
	return '/admin/content/media/edit_media/' + id;
};

EditMedia.prototype.genReturnVal = function(result) {
	return pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/media/manage_media');
};

//exports
module.exports = EditMedia;
