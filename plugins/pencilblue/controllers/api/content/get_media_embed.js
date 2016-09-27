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
    var MediaServiceV2 = pb.MediaServiceV2;

    /**
     * Retrieve a media embed for use in an editor
     * @deprecated
     * @class GetMediaEmbedApiController
     * @constructor
     * @extends BaseController
     */
    function GetMediaEmbedApiController(){}
    util.inherits(GetMediaEmbedApiController, pb.BaseController);

    /**
     * Initializes the controller to instantiate the service
     * @method initSync
     * @param {object} context
     */
    GetMediaEmbedApiController.prototype.initSync = function(/*context*/) {

        /**
         * @property service
         * @type {MediaServiceV2}
         */
        this.service = new MediaServiceV2(this.getServiceContext());
    };

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
        }

        //parse additional info
        var flag = pb.MediaServiceV2.parseMediaFlag(get.tag);
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
        this.service.renderById(get.id, options, function(err, html) {
            if (util.isError(err)) {
                return this.reqHandler.serveError(err);
            }
            else if (!html) {
                return cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, this.ls.g('generic.UNSUPPORTED_MEDIA'))
                });
            }

            var containerStyleStr = pb.MediaServiceV2.getStyleForPosition(flag.style.position) || '';
            html = '<div id="media_preview_' + get.id + '" class="media_preview" media-tag="'+ flag.cleanFlag + '" style="' + containerStyleStr + '">' + html + '</div>';
            cb({
                content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, '', html)
            });
        });
    };

    //exports
    return GetMediaEmbedApiController;
};
