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
     * Returns the HTML for a media preview
     * @class GetMediaPreviewApiController
     * @constructor
     * @extends BaseController
     */
    function GetMediaPreviewApiController(){}
    util.inherits(GetMediaPreviewApiController, pb.BaseAdminController);

    /**
     * Renders the preview
     * @method render
     * @param {Function} cb
     */
    GetMediaPreviewApiController.prototype.render = function(cb) {
        var self = this;
        var get  = this.query;

        //validate request
        if (!pb.validation.isIdStr(get.id, true) && !pb.validation.isStr(get.location, true)) {
            return cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
            });
        }

        //retrieve rendering
        var options = {
            view: 'view'
        };
        var mediaService = new pb.MediaService(null, self.site, true);
        if (get.id) {
            mediaService.renderById(get.id, options, function(err, html) {
                self.renderComplete(err, html, cb);
            });
        }
        else if (get.location && get.type){

            var renderOptions = {
                view: 'view',
                location: get.location,
                type: get.type
            };
            mediaService.renderByLocation(renderOptions, function(err, html) {
                self.renderComplete(err, html, cb);
            });
        }
        else {
            this.renderComplete(null, null, cb);
        }
    };

    /**
     * When the rendering is complete this function can be called to serialize the 
     * result back to the client in the standard API wrapper format.
     * @method renderComplete
     * @param {Error} err
     * @param {String} html
     * @param {Function} cb
     */
    GetMediaPreviewApiController.prototype.renderComplete = function(err, html, cb) {
        if (util.isError(err)) {
            return this.reqHandler.serveError(err);
        }
        else if (!html) {
            return cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, this.ls.get('UNSUPPORTED_MEDIA'))
            });
        }

        html = '<div class="embed-responsive embed-responsive-16by9">' + html + '</div>';
        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, '', html)});
    };

    //exports
    return GetMediaPreviewApiController;
};
