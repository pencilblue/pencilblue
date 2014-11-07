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

var mediaService = require(DOCUMENT_ROOT + '/include/service/entities/media_service.js');

//inheritance
util.inherits(AddMediaActionController, pb.FormController);

AddMediaActionController.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;

	console.log(post);

	var message = this.hasRequiredParams(post, this.getRequiredParams());
    if(message) {
        cb({
			code: 400,
			content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
		});
		return;
    }

    var mediaDocument = pb.DocumentCreator.create('media', post, ['media_topics'], ['is_file']);
    var mediaService = new pb.MediaService();
    mediaService.save(mediaDocument, function(err, result) {
        if(util.isError(err)) {
			cb({
				code: 500,
				content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
			});
            return;
        }
        else if(util.isArray(result)) {
			cb({
				code: 400,
				content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, pb.CustomObjectService.createErrorStr(result))
			});
        }

		result.icon = mediaService.getMediaIcon(result.media_type);

		cb({
			code: 200,
			content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, result.name + ' ' + self.ls.get('ADDED'), result)
		});
    });
};

AddMediaActionController.prototype.getRequiredParams = function() {
	return ['media_type', 'location', 'name'];
};

//exports
module.exports = AddMediaActionController;
