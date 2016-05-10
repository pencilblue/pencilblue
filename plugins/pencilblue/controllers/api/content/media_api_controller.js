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

module.exports = function(pb) {

    //PB dependencies
    var util              = pb.util;
    var MediaServiceV2    = pb.MediaServiceV2;
    var BaseObjectService = pb.BaseObjectService;

    /**
     * Provides access to media descriptors and the content that backs them.  It also provides a mechanism for
     * constructing snippets of HTML to more easily display content for various purposes.
     * @class MediaApiController
     * @constructor
     * @extends BaseApiController
     */
    function MediaApiController(){}
    util.inherits(MediaApiController, pb.BaseApiController);

    /**
     * Initializes the controller by instantiating the service
     * @method initSync
     * @param {object} context
     */
    MediaApiController.prototype.initSync = function(/*context*/) {
        this.service = new MediaServiceV2(this.getServiceContext());
    };


    /**
     * Renders HTML for a piece of media based on the location (URL or mediaId) and type.  The type is required if the
     * fully qualified URL is not provided as the location
     * @method renderByLocation
     * @param {function} cb
     */
    MediaApiController.prototype.renderByLocation = function(cb) {
        var options = MediaApiController.buildRenderOptionsFromQuery(this.query);
        this.service.renderByLocation(options, MediaApiController.onMediaRenderComplete(cb));
    };

    /**
     * Renders HTML for a piece of media based on the ID of the media descriptor.
     * @method renderById
     * @param {function} cb
     */
    MediaApiController.prototype.renderById = function(cb) {
        var id = this.pathVars.id;
        var options = MediaApiController.buildRenderOptionsFromQuery(this.query);
        this.service.renderById(id, options, MediaApiController.onMediaRenderComplete(cb));
    };

    /**
     * Downloads a piece of media by the media descriptor's ID
     * @method downloadById
     * @param {function} cb
     */
    MediaApiController.prototype.downloadById = function(cb) {
        var self = this;
        var id = this.pathVars.id;
        this.service.getContentStreamById(id, function(err, streamWrapper) {
            if (util.isError(err)) {
                return cb(err);
            }
            if (!streamWrapper || !streamWrapper.stream) {
                return cb(BaseObjectService.notFound());
            }

            //set the mime type if we can guess with a good level of certainty
            if (streamWrapper.mime) {
                self.res.setHeader('content-type', streamWrapper.mime);
            }

            //now pipe the stream out as the response
            streamWrapper.stream.once('end', function() {
                    //do nothing. content was streamed out and closed
                })
                .once('error', function(err) {

                    //check for file level not found
                    if (err.message.indexOf('ENOENT') === 0) {
                        self.reqHandler.serve404();
                    }
                    else {//some provider error - just serve it up
                        pb.log.error('Failed to load media: MIME=%s ID=%s', streamWrapper.mime, id);
                        err.code = isNaN(err.code) ? 500 : err.code;
                        self.reqHandler.serveError(err);
                    }
                })
                .pipe(self.res);
        });
    };

    /**
     * Processes the query string to develop the where clause for the query request
     * @method processWhere
     * @param {Object} q The hash of all query parameters from the request
     * @return {Object}
     */
    MediaApiController.prototype.processWhere = function(q) {
        var where = null;
        var failures = [];

        //build query & get results
        var search = q.q;
        if (pb.ValidationService.isNonEmptyStr(search, true)) {

            var patternStr = ".*" + util.escapeRegExp(search) + ".*";
            var pattern = new RegExp(patternStr, "i");
            where = {
                $or: [
                    {name: pattern},
                    {caption: pattern},
                ]
            };
        }

        var topicId = q.topic;
        if (pb.ValidationService.isIdStr(topicId, true)) {
            where = where || {};
            where.media_topics = topicId;
        }

        return {
            where: where,
            failures: failures
        };
    };

    /**
     * When the rendering is complete this function can be called to serialize the
     * result back to the client in the standard API wrapper format.
     * @static
     * @method onMediaRenderComplete
     * @param {Function} cb
     * @return {Function}
     */
    MediaApiController.onMediaRenderComplete = function(cb) {
        return function(err, html) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (!html) {
                //serve 404 in non-traditional way.  This allows us to keep the response light.  We don't want to serve the
                // whole 404 page for a snippet
                return cb({
                    code: 404,
                    content: ''
                });
            }
            cb({content: html});
        };
    };

    /**
     * Constructs the options for a query for render.
     * @static
     * @method buildRenderOptionsFromQuery
     * @param {object} q
     * @returns {{view: (*|string), type: *, location: *}}
     */
    MediaApiController.buildRenderOptionsFromQuery = function(q) {
        return {
            view: q.view || 'view',
            type: q.type,
            location: q.location
        };
    };

    //exports
    return MediaApiController;
};
