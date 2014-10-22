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
 * Adds new media
 */

function AddMediaActionController(){}

//inheritance
util.inherits(AddMediaActionController, pb.FormController);

AddMediaActionController.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;

	delete post.topic_search;

	var message = this.hasRequiredParams(post, this.getRequiredParams());
    if(message) {
        this.formError(message, this.getFormErrorRedirect(), cb);
        return;
    }

    var mediaDocument = pb.DocumentCreator.create('media', post, ['media_topics'], ['is_file']);
    var mediaService = new pb.MediaService();
    mediaService.save(mediaDocument, function(err, result) {
        if (util.isError(err)) {
            self.formError(self.ls.get('ERROR_SAVING'), self.getFormErrorRedirect(), cb);
            return;
        }
        else if (util.isArray(result)) {
            return self.formError(pb.CustomObjectService.createErrorStr(result), self.getFormErrorRedirect(), cb);
        }
        self.onSaveSuccessful(result, cb);
    });
};

AddMediaActionController.prototype.onSaveSuccessful = function(mediaDocument, cb) {
	this.session.success = mediaDocument.name + ' ' + this.ls.get('ADDED');
	this.redirect('/admin/content/media/add_media', cb);
};

AddMediaActionController.prototype.getRequiredParams = function() {
	return ['media_type', 'location', 'name'];
};

AddMediaActionController.prototype.getFormErrorRedirect = function(){
	return '/admin/content/media/add_media';
};

//exports
module.exports = AddMediaActionController;
