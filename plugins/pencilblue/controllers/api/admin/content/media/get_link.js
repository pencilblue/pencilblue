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
     * Returns information on a media link
     * @class GetMediaLinkApiController
     * @constructor
     * extends BaseController
     */
    function GetMediaLinkApiController(){}
    util.inherits(GetMediaLinkApiController, pb.BaseController);
    
    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    GetMediaLinkApiController.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {

            /**
             * An instance of MediaService that leverages the default media provider
             * @property service
             * @type {TopicService}
             */
            self.service = new pb.MediaService(null, context.site, true);

            cb(err, true);
        };
        GetMediaLinkApiController.super_.prototype.init.apply(this, [context, init]);
    };

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

        this.service.getMediaDescriptor(get.url, function(err, descriptor) {
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
    return GetMediaLinkApiController;
};
