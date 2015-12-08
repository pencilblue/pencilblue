/*
    Copyright (C) 2015  PencilBlue, LLC

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

module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Deletes media
     * @class DeleteMediaController
     * @constructor
     * @extends FormController
     */
    function DeleteMediaController(){}
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
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
            });
            return;
        }

        var mservice = new pb.MediaService(null, self.site, true);
        mservice.loadById(vars.id, function(err, mediaData) {
            if(util.isError(err) || !mediaData) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
                });
                return;
            }

            mservice.deleteById(vars.id, function(err, recordsDeleted) {
                if(util.isError(err) || recordsDeleted <= 0) {
                    cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_DELETING'))
                    });
                    return;
                }

                self.removeLocal(mediaData, mservice, function(err) {
                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, mediaData.name + ' ' + self.ls.get('DELETED'))});
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
    return DeleteMediaController;
};
