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
    var util         = pb.util;

    /**
     * Edits media
     * @class EditMediaActionController
     * @extends BaseAdminController
     * @constructor
     */
    function EditMediaActionController(){}
    util.inherits(EditMediaActionController, pb.BaseAdminController);

    /**
     *
     * @method onPostParamsRetrieved
     */
    EditMediaActionController.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        this.getJSONPostParams(function(err, post) {
            delete post[pb.DAO.getIdField()];

            var message = self.hasRequiredParams(post, self.getRequiredParams());
            if(message) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
                });
                return;
            }

            var mediaService = new pb.MediaService(null, self.site);
            mediaService.loadById(vars.id, function(err, media) {
                if(util.isError(err) || media === null) {
                    cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
                    });
                    return;
                }

                //update existing document
                pb.DocumentCreator.update(post, media);
                mediaService.save(media, function(err, result) {
                    if(util.isError(err) || util.isArray(result)) {
                        cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                        });
                        return;
                    }

                    result.icon = pb.MediaService.getMediaIcon(media.media_type);
                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, media.name + ' ' + self.ls.get('EDITED'), result)});
                });
            });
        });
    };

    EditMediaActionController.prototype.getRequiredParams = function() {
        return ['media_type', 'location', 'name'];
    };

    //exports
    return EditMediaActionController;
};
