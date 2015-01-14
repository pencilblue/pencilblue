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

/**
 * Returns information on a media link
 * @class GetMediaLinkApiController
 * @constructor
 * extends BaseController
 */
function GetMediaLinkApiController(){}

//inheritance
util.inherits(GetMediaLinkApiController, pb.BaseController);

/**
 * Inspects the provided URL and returns a media descriptor for the URL.  If 
 * the media type is not supported a 400 will be returned to the client.  
 * @method render
 * @param {Function} cb
 */
GetMediaLinkApiController.prototype.render = function(cb) {
    var self = this;
    var get  = this.query;

    if (!pb.validation.isUrl(get.url, true)) {
        return cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_URL'))
        });
    }
    
    var service = new pb.MediaService();
    service.getMediaDescriptor(get.url, function(err, descriptor) {
        if (util.isError(err)) {
            return self.reqHandler.serveError(err);
        }
        else if (!descriptor) {
            return cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_URL'))
            }); 
        }
        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, '', descriptor)});
    });
};

//exports
module.exports = GetMediaLinkApiController;
