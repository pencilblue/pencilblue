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

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Media Content Controller is responsible for taking incoming requests for media and
     * providing the right content for it or redirecting to where it should be.
     * @class MediaContentController
     * @constructor
     * @extends BaseController
     */
    function MediaContentController() {};
    util.inherits(MediaContentController, pb.BaseController);

    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    MediaContentController.prototype.init = function(context, cb) {
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
        MediaContentController.super_.prototype.init.apply(this, [context, init]);
    };

    /**
     * @method render
     * @param {Function} cb
     */
    MediaContentController.prototype.render = function(cb) {
        var self      = this;

        var mime = pb.RequestHandler.getMimeFromPath(this.req.url);
        if (mime) {
            this.res.setHeader('content-type', mime);
        }

        //load the media if available
        var mediaPath = this.req.url;
        this.service.getContentStreamByPath(mediaPath, function(err, mstream) {
            if(util.isError(err)) {
                return self.reqHandler.serveError(err);
            }

            mstream.once('end', function() {
                //do nothing. content was streamed out and closed
            })
            .once('error', function(err) {
                if (err.message.indexOf('ENOENT') === 0) {
                    self.reqHandler.serve404();
                }
                else {
                    pb.log.error('Failed to load media: MIME=%s PATH=%s', mime, mediaPath);
                    err.code = isNaN(err.code) ? 500 : err.code;
                    self.reqHandler.serveError(err);
                }
            })
            .pipe(self.res);
        });
    };

    //exports
    return MediaContentController;
};
