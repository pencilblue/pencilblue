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
 * @class DeleteMediaController
 * @constructor
 * @extends FormController
 */
function DeleteMediaController(){}

//inheritance
util.inherits(DeleteMediaController, pb.FormController);

//constants
var MANAGE_MEDIA_PATH = '/admin/content/media/manage_media';

/**
 * @method onPostParamsRetrieved
 * @param {Object} post
 * @param {Function} cb
 */
DeleteMediaController.prototype.onPostParamsRetrieved = function(post, cb) {
    var self = this;
    var vars = this.pathVars;

    var message = this.hasRequiredParams(vars, ['id']);
    if(message) {
        this.formError(message, MANAGE_MEDIA_PATH, cb);
        return;
    }

    var mservice = new pb.MediaService();
    mservice.loadById(vars.id, function(err, mediaData) {
        if(util.isError(err) || !mediaData) {
            self.formError(self.ls.get('ERROR_DELETING'), MANAGE_MEDIA_PATH, cb);
            return;
        }

        mservice.deleteById(vars.id, function(err, recordsDeleted) {
            if(util.isError(err) || recordsDeleted <= 0) {
                self.formError(self.ls.get('ERROR_DELETING'), MANAGE_MEDIA_PATH, cb);
                return;
            }

            self.removeLocal(mediaData, mservice, function(err) {
            	self.session.success = mediaData.name + ' ' + self.ls.get('DELETED');
            	self.redirect('/admin/content/media/manage_media', cb);
            });
        });
    });
};

DeleteMediaController.prototype.removeLocal = function(media, mservice, cb) {
    if (!media.is_file) {
        return cb();
    }
    mservice.deleteContentByPath(media.location, cb);
};

//exports
module.exports = DeleteMediaController;
