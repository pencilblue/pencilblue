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
var MongoDB   = require('mongodb');
var GridStore = MongoDB.GridStore;
var util      = require('../../util.js');

module.exports = function MongoMediaProviderModule(pb) {

    /**
     * A media provider that uses Mongo's GridFS as the method of storage.
     * @class MongoMediaProvider
     * @constructor
     * @param {Object} context
     * @param {String} context.site
     */
    function MongoMediaProvider(/*context*/) {};

    /**
     * Retrieves the item in GridFS as a stream. 
     * @method getStream
     * @param {String} mediaPath The path/key to the media.  Typically this is a 
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Object} [options] Options for interacting with S3
     * @param {String} [options.bucket] The S3 bucket to interact with
     * @param {Function} cb A callback that provides two parameters: An Error, if 
     * occurred and a ReadableStream that contains the media content.
     */
    MongoMediaProvider.prototype.getStream = function(mediaPath, cb) {

        pb.dbm.getDb(pb.config.db.name, function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }
            
            var gs  = new GridStore(db, mediaPath, 'r');
            gs.open(function(err, gs) {
                if (util.isError(err)) {
                    return cb(err);
                }

                cb(null, gs.stream(true));
            });
        });
    };

    /**
     * Retrieves the content from GridFS as a String or Buffer.
     * @method get
     * @param {String} mediaPath The path/key to the media.  Typically this is a 
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Function} cb A callback that provides two parameters: An Error, if 
     * occurred and an entity that contains the media content.
     */
    MongoMediaProvider.prototype.get = function(mediaPath, cb) {

        pb.dbm.getDb(pb.config.db.name, function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }
            
            var gs  = new GridStore(db, mediaPath, 'r');
            gs.open(function(err, gs) {
                if (util.isError(err)) {
                    return cb(err);
                }

                gs.read(function(err, data) {
                    if (util.isError(err)) {
                        return cb(err);
                    }

                    gs.close(function(err) {
                        cb(err, data);
                    });
                });
            });
        });
    };

    /**
     * Sets media content into GridFS based on the specified media path and 
     * options.  The stream provided must be a ReadableStream.
     * @method setStream
     * @param {ReadableStream} stream The content stream
     * @param {String} mediaPath The path/key to the media.  Typically this is a 
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Function} cb A callback that provides two parameters: An Error, if 
     * occurred and the success of the operation.
     */
    MongoMediaProvider.prototype.setStream = function(stream, mediaPath, cb) {
        var self = this;

        var buffers = [];
        stream.on('data', function(buffer) {
            buffers.push(buffer);
        });
        stream.on('end', function() {

            var buffer = Buffer.concat(buffers);
            self.set(buffer, mediaPath, cb);
        });
        stream.on('error', function(err) {
            cb(err);
        });
    };

    /**
     * Sets media content into GridFS based on the specified media path and 
     * options.  The data must be in the form of a String or Buffer.
     * @method setStream
     * @param {String|Buffer} fileDataStrOrBuffOrStream The content to persist
     * @param {String} mediaPath The path/key to the media.  Typically this is a 
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Function} cb A callback that provides two parameters: An Error, if 
     * occurred and the success of the operation.
     */
    MongoMediaProvider.prototype.set = function(fileDataStrOrBuff, mediaPath, cb) {

        var opt = {
            content_type: "application/octet-stream",
            metadata:{
                provider: "MongoMediaProvider",
                mediaPath: mediaPath
            }
        };
        
        pb.dbm.getDb(pb.config.db.name, function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }
            
            var gs  = new GridStore(db, mediaPath, 'w', opt);
            gs.open(function(err, gs) {
                gs.write(fileDataStrOrBuff, true, cb);
            });
        });
    };

    /**
     * Not Implemented
     * @method createWriteStream
     * @param {String} mediaPath The path/key to the media.  Typically this is a 
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Function} cb A callback that provides two parameters: An Error, if 
     * occurred and a WriteableStream.
     */
    MongoMediaProvider.prototype.createWriteStream = function(mediaPath, cb) {
        throw new Error('Not implemented');
    };

    /**
     * Checks to see if the file actually exists in GridFS
     * @method exists
     * @param {String} mediaPath The path/key to the media.  Typically this is a 
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Function} cb A callback that provides two parameters: An Error, if 
     * occurred and a Boolean.
     */
    MongoMediaProvider.prototype.exists = function(mediaPath, cb) {

        pb.dbm.getDb(pb.config.db.name, function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }
            
            GridStore.exist(db, mediaPath, cb);
        });
    };

    /**
     * Deletes a file from the GridFS
     * @method delete
     * @param {String} mediaPath The path/key to the media.  Typically this is a 
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Function} cb A callback that provides two parameters: An Error, if 
     * occurred and the success of the operation.
     */
    MongoMediaProvider.prototype.delete = function(mediaPath, cb) {

        pb.dbm.getDb(pb.config.db.name, function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }
            
            GridStore.unlink(db, mediaPath, cb);
        });
    };

    /**
     * Retrieve the stats on the file
     * @method stat
     * @param {String} mediaPath The path/key to the media.  Typically this is a 
     * path such as: /media/2014/9/540a3ff0e30ddfb9e60000be-1409957872680.jpg
     * @param {Function} cb A callback that provides two parameters: An Error, if 
     * occurred and an object that contains the file stats
     */
    MongoMediaProvider.prototype.stat = function(mediaPath, cb) {

        pb.dbm.getDb(pb.config.db.name, function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }
            
            var gs  = new GridStore(db, mediaPath, 'r');
            gs.open(function(err, gs) {
                if (util.isError(err)) {
                    return cb(err);
                }

                var stat = {
                    length: gs.length,
                    contentType: gs.contentType,
                    uploadDate: gs.uploadDate,
                    metadata: gs.metadata,
                    chunkSize: gs.chunkSize
                };
                gs.close(function(err) {
                    cb(err, stat);
                });
            });
        });
    };

    //exports
    return MongoMediaProvider;
};
