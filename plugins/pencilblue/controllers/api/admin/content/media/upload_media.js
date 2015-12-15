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

//dependencies
var fs         = require('fs');
var formidable = require('formidable');
var async      = require('async');

module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Uploads a media file to the system
     * @class UploadMediaController
     * @constructor
     */
    function UploadMediaController(){

        /**
         * Tracks the number of times the progress event fires and the number of
         * bytes received exceeds the maximum size allowed.
         * @property errored
         * @type {Integer}
         */
        this.errored = 0;
    }
    util.inherits(UploadMediaController, pb.BaseController);
    
    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    UploadMediaController.prototype.init = function(context, cb) {
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
        UploadMediaController.super_.prototype.init.apply(this, [context, init]);
    };


    UploadMediaController.prototype.render = function(cb) {
        var self  = this;

        //set the limits on the file size
        var form = new formidable.IncomingForm();
        form.maxFieldSize = pb.config.media.max_upload_size;
        form.on('progress', function(bytesReceived, bytesExpected) {
            if (bytesReceived > pb.config.media.max_upload_size || bytesExpected > pb.config.max_upload_size) {
                if (!self.errored++) {
                    this.emit('error', new Error(self.ls.get('FILE_TOO_BIG')));
                }
            }
        });

        //parse the form out and let us know when its done
        form.parse(this.req, function(err, fields, files) {
            if (util.isError(err)) {
                return self.onDone(err, null, files, cb);
            }

            var keys = Object.keys(files);
            if (keys.length === 0) {
                return self.onDone(new Error('No file inputs were submitted'), null, files, cb);
            }
            var fileDescriptor = files[keys[0]];

            var stream = fs.createReadStream(fileDescriptor.path);
            self.service.setContentStream(stream, fileDescriptor.name, function(err, sresult) {
                if (util.isError(err)) {
                    return self.onDone(err, null, files, cb);
                }

                //write the response
                var content = {
                    content: JSON.stringify({
                        filename: sresult.mediaPath
                    }),
                    content_type: 'application/json'
                };
                self.onDone(null, content, files, cb);
            });
        });
    };

    /**
     * Handles the cleanup after the incoming form data has been processed.  It
     * attempts to remove uploaded files or file partials after a failure or
     * completion.
     * @method onDone
     * @param {Error} err
     * @param {Object} content
     * @param {Object} [files={}]
     * @param {Function} cb
     */
    UploadMediaController.prototype.onDone = function(err, content, files, cb) {
        if (util.isFunction(files)) {
            cb = files;
            files = null;
        }
        if (!util.isObject(files)) {
            files = {};
        }

        //ensure all files are removed
        var self = this;
        var tasks = util.getTasks(Object.keys(files), function(fileFields, i) {
            return function(callback) {
                var fileDescriptor = files[fileFields[i]];

                //ensure file has a path to delete
                if (!fileDescriptor.path) {
                    return callback();
                }

                //remove the file
                fs.unlink(fileDescriptor.path, function(err) {
                    pb.log.info('Removed temporary file: %s', fileDescriptor.path);
                    callback();
                });
            };
        });
        async.parallel(tasks, function(error, results) {

            //weird case where formidable continues to process content even after
            //we cancel the stream with a 413.  This is a check to make sure we
            //don't call back again
            if (self.errored > 1) {
                return;
            }

            //we only care about the passed in error
            if (util.isError(err)) {
                var code = err.message === self.ls.get('FILE_TOO_BIG') ? 413 : 500;
                return cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, err.message), code: code});
            }
            cb(content);
        });
    };

    //exports
    return UploadMediaController;
};
