/*
    Copyright (C) 2016  PencilBlue, LLC

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
'use strict';

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Adds new media
     * @class NewMediaApiController
     * @constructor
     * @extends BaseAdminController
     */
    function NewMediaApiController(){}
    util.inherits(NewMediaApiController, pb.BaseAdminController);

    NewMediaApiController.prototype.render = function(cb) {
        var self = this;

        this.getJSONPostParams(function(err, post) {
            var message = self.hasRequiredParams(post, self.getRequiredParams());
            if(message) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
                });
                return;
            }

            var mediaDocument = pb.DocumentCreator.create('media', post);
            var mediaService = new pb.MediaService(null, self.site);
            mediaService.save(mediaDocument, function(err, result) {
                if(util.isError(err)) {
                    return cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'))
                    });
                }
                else if (util.isArray(result)) {
                    return cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'), result)
                    });
                }

                mediaDocument.icon = pb.MediaServiceV2.getMediaIcon(mediaDocument.media_type);
                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, mediaDocument.name + ' ' + self.ls.g('admin.ADDED'), mediaDocument)});
            });
        });
    };

    /**
     * @static
     * @method getRequiredParams
     */
    NewMediaApiController.prototype.getRequiredParams = function() {
        return ['media_type', 'location', 'name'];
    };

    //exports
    return NewMediaApiController;
};
