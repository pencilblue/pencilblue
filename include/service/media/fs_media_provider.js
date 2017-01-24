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

//dependencies
var _ = require('lodash');
var async = require('async');
var Configuration = require('../../config');
var fs    = require('fs');
var log = require('../../utils/logging').newInstance('FsMediaProvider');
var os    = require('os');
var path  = require('path');
const TaskUtils = require('../../../lib/utils/taskUtils');

/**
 * A media provider that uses the underlying file system as the method of
 * storage.
 * @class FsMediaProvider
 * @constructor
 * @param {Object} context
 * @param {String} [context.parentDir]
 * @param {String} context.site
 */
class FsMediaProvider {
    constructor(context) {
        this.parentDir = context.parentDir || Configuration.active.media.parent_dir;
    }

    /**
     * Retrieves the item on the file system as a stream.
     * @method getStream
     * @param {String} mediaPath The path/key to the media.  Typically this is a
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Object} [options] Options for interacting with S3
     * @param {String} [options.bucket] The S3 bucket to interact with
     * @param {Function} cb A callback that provides two parameters: An Error, if
     * occurred and a ReadableStream that contains the media content.
     */
    getStream (mediaPath, cb) {
        var ap = FsMediaProvider.getMediaPath(this.parentDir, mediaPath);
        cb(null, fs.createReadStream(ap));
    }

    /**
     * Retrieves the content from the file system as a String or Buffer.
     * @method get
     * @param {String} mediaPath The path/key to the media.  Typically this is a
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Function} cb A callback that provides two parameters: An Error, if
     * occurred and an entity that contains the media content.
     */
    get (mediaPath, cb) {
        var ap = FsMediaProvider.getMediaPath(this.parentDir, mediaPath);
        fs.readFile(ap, cb);
    }

    /**
     * Sets media content into the file system based on the specified media path and
     * options.  The stream provided must be a ReadableStream.
     * @method setStream
     * @param {ReadableStream} stream The content stream
     * @param {String} mediaPath The path/key to the media.  Typically this is a
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Function} cb A callback that provides two parameters: An Error, if
     * occurred and the success of the operation.
     */
    setStream (stream, mediaPath, cb) {

        this.createWriteStream(mediaPath, function (err, fileStream) {
            if (_.isError(err)) {
                return cb(err);
            }

            log.silly('FsMediaProvider: Piping stream to [%s]', mediaPath);
            stream.pipe(fileStream);
            stream.on('end', cb);
            stream.on('error', cb);
        });
    }

    /**
     * Sets media content into an file system based on the specified media path and
     * options.  The data must be in the form of a String or Buffer.
     * @method setStream
     * @param {String|Buffer} fileDataStrOrBuffOrStream The content to persist
     * @param {String} mediaPath The path/key to the media.  Typically this is a
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Function} cb A callback that provides two parameters: An Error, if
     * occurred and the success of the operation.
     */
    set (fileDataStrOrBuff, mediaPath, cb) {
        var ap = FsMediaProvider.getMediaPath(this.parentDir, mediaPath);
        this.mkdirs(ap, function (err) {
            if (_.isError(err)) {
                return cb(err);
            }
            fs.writeFile(ap, fileDataStrOrBuff, cb);
        });
    }

    /**
     * Creates a writable stream to a file with the specified path.  The resource
     * is overwritten if already exists.
     * @method createWriteStream
     * @param {String} mediaPath The path/key to the media.  Typically this is a
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Function} cb A callback that provides two parameters: An Error, if
     * occurred and a WriteableStream.
     */
    createWriteStream (mediaPath, cb) {
        var ap = FsMediaProvider.getMediaPath(this.parentDir, mediaPath);
        this.mkdirs(ap, function (err) {
            if (_.isError(err)) {
                return cb(err);
            }

            try {
                cb(null, fs.createWriteStream(ap));
            }
            catch (e) {
                cb(e);
            }
        });
    }

    /**
     * Checks to see if the file actually exists on disk
     * @method exists
     * @param {String} mediaPath The path/key to the media.  Typically this is a
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Function} cb A callback that provides two parameters: An Error, if
     * occurred and a Boolean.
     */
    exists (mediaPath, cb) {
        var ap = FsMediaProvider.getMediaPath(this.parentDir, mediaPath);
        fs.exists(ap, function (exists) {
            cb(null, exists);
        });
    }

    /**
     * Deletes a file from the file system
     * @method delete
     * @param {String} mediaPath The path/key to the media.  Typically this is a
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Function} cb A callback that provides two parameters: An Error, if
     * occurred and the success of the operation.
     */
    delete (mediaPath, cb) {
        var ap = FsMediaProvider.getMediaPath(this.parentDir, mediaPath);
        fs.exists(ap, function (exists) {
            fs.unlink(ap, cb);
        });
    }

    /**
     * Retrieve the stats on the file
     * @method stat
     * @param {String} mediaPath The path/key to the media.  Typically this is a
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Function} cb A callback that provides two parameters: An Error, if
     * occurred and an object that contains the file stats
     */
    stat (mediaPath, cb) {
        var ap = FsMediaProvider.getMediaPath(this.parentDir, mediaPath);
        fs.stat(ap, cb);
    }

    /**
     * Recursively creates the directory structure based on the absolute file path
     * provided.
     * @method mkdirs
     * @param {String} absoluteFilePath
     * @param {Function} A callback that provides two parameters: Error, if
     * occurred and result of the attempt at the creation of each directory in the
     * path.
     */
    mkdirs (absoluteFilePath, cb) {

        var pieces = absoluteFilePath.split(path.sep);
        log.silly('FsMediaProvider: Ensuring directories exist for path: %s', absoluteFilePath);

        var curr = '';
        var isWindows = os.type().toLowerCase().indexOf('windows') !== -1;
        var tasks = TaskUtils.getTasks(pieces, function (p, i) {
            return function (callback) {

                //we need to skip the first one bc it will probably be empty and we
                //want to skip the last one because it will probably be the file
                //name not a directory.
                if (p.length === 0 || i >= pieces.length - 1) {
                    return callback();
                }

                curr += (isWindows && i === 0 ? '' : path.sep) + p;
                fs.exists(curr, function (exists) {
                    if (exists) {
                        log.silly('FsMediaProvider: Skipping creation of [%s] because it already exists', curr);
                        return callback();
                    }

                    log.silly('FsMediaProvider: Creating directory [%s]', curr);
                    fs.mkdir(curr, callback);
                });
            };
        });
        async.series(tasks, cb);
    }

    /**
     * Generates an absolute path based on the parent directory and media path.
     * The parent directory is expected to a single directory or set of directories
     * nested under the Configuration.active.docRoot.
     * @static
     * @method getMediaPath
     * @param {String} parentDir
     * @param {String} mediaPath
     * @return {String} Absolute path to the resource
     */
    getMediaPath (parentDir, mediaPath) {

        var absolutePath = '';
        if (parentDir.indexOf('/') !== 0) {

            //we have a relative path meant to be from the project directory
            absolutePath = path.join(Configuration.active.docRoot, parentDir, mediaPath);
        }
        else {
            absolutePath = path.join(parentDir, mediaPath);
        }
        return absolutePath;
    }
}

//exports
module.exports = FsMediaProvider;
