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
 * Edits media
 * @class EditMediaPostController
 */
function EditMediaPostController(){}

//inheritance
util.inherits(EditMediaPostController, pb.FormController);

EditMediaPostController.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var vars = this.pathVars;

	delete post.topic_search;

	pb.utils.merge(vars, post);

	var message = this.hasRequiredParams(post, this.getRequiredParams());
    if(message) {
        this.formError(message, this.getFormErrorRedirect(post.id), cb);
        return;
    }

    var mservice = new pb.MediaService();
    mservice.loadById(post.id, function(err, media) {
    	if (util.isError(err)) {
            self.reqHandler.serveError(err);
        }
        else if(media === null) {
            self.formError(self.ls.get('ERROR_SAVING'), self.getFormErrorRedirect(post.id), cb);
            return;
        }

        //update existing document
        pb.DocumentCreator.update(post, media, ['media_topics'], ['is_file']);
        var dao = new pb.DAO();
        dao.save(media, function(err, result) {
            if (util.isError(err)) {
                self.formError(self.ls.get('ERROR_SAVING'), self.getFormErrorRedirect(), cb);
                return;
            }

            self.onSaveSuccessful(media);
			self.redirect('/admin/content/media/manage_media', cb);
        });
    });
};

EditMediaPostController.prototype.onSaveSuccessful = function(mediaDocument) {
	this.session.success = mediaDocument.name + ' ' + this.ls.get('EDITED');
};

EditMediaPostController.prototype.getRequiredParams = function() {
	return ['media_type', 'location', 'name'];
};

EditMediaPostController.prototype.getFormErrorRedirect = function(id){
	return '/admin/content/media/edit_media/' + id;
};

//exports
module.exports = EditMediaPostController;
