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
 * Deletes media
 */

function DeleteMedia(){}

//inheritance
util.inherits(DeleteMedia, pb.FormController);

DeleteMedia.prototype.onPostParamsRetrieved = function(post, cb) {
    var self = this;
    var vars = this.pathVars;

    var message = this.hasRequiredParams(vars, ['id']);
    if(message) {
        this.formError(message, '/admin/content/media/manage_media', cb);
        return;
    }

    var dao = new pb.DAO();
    dao.query('media', {_id: ObjectID(vars.id)}).then(function(mediaData) {
        if(util.isError(mediaData) || mediaData.length === 0) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/media/manage_media', cb);
            return;
        }

        dao.deleteById(vars.id, 'media').then(function(recordsDeleted) {
            if(recordsDeleted <= 0) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/media/manage_media', cb);
                return;
            }

            self.removeLocal(mediaData[0], function(err) {
            	self.session.success = mediaData[0].name + ' ' + self.ls.get('DELETED');
            	self.redirect('/admin/content/media/manage_media', cb);
            });
        });
    });
};

DeleteMedia.prototype.removeLocal = function(media, cb) {
	var file = path.join(DOCUMENT_ROOT, 'public', media.location);
	fs.exists(file, function(exists) {
		fs.unlink(file, cb);
	});
};

//exports
module.exports = DeleteMedia;
