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
     * Retrieve a media embed for use in an editor
     * @class GetMediaEmbedApiController
     * @constructor
     * @extends BaseController
     */
    function GetMediaEmbedApiController(){}
    util.inherits(GetMediaEmbedApiController, pb.BaseController);

    /**
     * Renders the media for embeding in the editor view
     * @method 
     */
    GetMediaEmbedApiController.prototype.render = function(cb) {
        var self = this;
        var get = this.query;

        //validation
        if(!pb.validation.isIdStr(get.id, true)) {
            return cb({
                status: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'invalid media Id')
            });
            return;
        }

        //parse additional info
        var flag = pb.MediaService.parseMediaFlag(get.tag);
        if (!flag) {
            flag = {
                cleanFlag: '',
                style: {}
            };
        }
        flag.style.position = flag.style.position || 'left';

        var options = {
            view: 'editor',
            style: {
                "max-height": (flag.style.maxHeight || '')
            }
        };
        var ms = new pb.MediaService(null, self.site, self.onlyThisSite);
        ms.renderById(get.id, options, function(err, html) {
            if (util.isError(err)) {
                return this.reqHandler.serveError(err);
            }
            else if (!html) {
                return cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, this.ls.get('UNSUPPORTED_MEDIA'))
                });
            }

            var containerStyleStr = pb.MediaService.getStyleForPosition(flag.style.position) || '';
            html = '<div id="media_preview_' + get.id + '" class="media_preview" media-tag="'+ flag.cleanFlag + '" style="' + containerStyleStr + '">' + html + '</div>';
            cb({
                content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, '', html)
            });
        });
    };

    //exports
    return GetMediaEmbedApiController;
};
