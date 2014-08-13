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

function AddMedia(){}

//inheritance
util.inherits(AddMedia, pb.FormController);

AddMedia.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;

	delete post.topic_search;

	var message = this.hasRequiredParams(post, this.getRequiredParams());
    if(message) {
        this.formError(message, this.getFormErrorRedirect(), cb);
        return;
    }

    var mediaDocument = pb.DocumentCreator.create('media', post, ['media_topics'], ['is_file']);
    var dao = new pb.DAO();
    dao.update(mediaDocument).then(function(result) {
        if (util.isError(result)) {
            self.formError(self.ls.get('ERROR_SAVING'), self.getFormErrorRedirect(), cb);
            return;
        }

        self.onSaveSuccessful(result, cb);
    });
};

AddMedia.prototype.onSaveSuccessful = function(mediaDocument, cb) {
	this.session.success = mediaDocument.name + ' ' + this.ls.get('ADDED');
	this.redirect('/admin/content/media/add_media', cb);
};

AddMedia.prototype.getRequiredParams = function() {
	return ['media_type', 'location', 'name'];
};

AddMedia.prototype.getFormErrorRedirect = function(){
	return '/admin/content/media/add_media';
};

//exports
module.exports = AddMedia;
