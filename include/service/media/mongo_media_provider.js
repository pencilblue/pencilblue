/*
    Copyright (C) 2014  PencilBlue, LLC

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

/**
 *
 * @class MongoMediaProvider
 * @constructor
 */
function MongoMediaProvider() {};

MongoMediaProvider.prototype.getStream = function(mediaPath, cb) {
    
    var db  = pb.dbm[pb.config.db.name];
    var gs  = new GridStore(db, mediaPath, 'r');
    gs.open(function(err, gs) {
        if (util.isError(err)) {
            return cb(err);
        }
        
        cb(null, gs.stream(true));
    });
};

MongoMediaProvider.prototype.get = function(mediaPath, cb) {
    
    var db  = pb.dbm[pb.config.db.name];
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
};

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

MongoMediaProvider.prototype.set = function(fileDataStrOrBuff, mediaPath, cb) {
    
    var opt = {
        content_type: "application/octet-stream",
        metadata:{
            provider: "MongoMediaProvider",
            mediaPath: mediaPath
        }
    };
    var db  = pb.dbm[pb.config.db.name];
    var gs  = new GridStore(db, mediaPath, 'w', opt);
    gs.open(function(err, gs) {
        
        gs.writeFile(/*fileDataStrOrBuff*/'/Users/brian/Downloads/1064381_10101319920121409_1095650388_o.jpg', function(err, result) {console.log('here');
            if (util.isError(err)) {
                return cb(err);
            }
            console.log('here2');
            gs.close(function(err) {console.log('here3');
                cb(err, result);
            });
        });
    });
};

MongoMediaProvider.prototype.createWriteStream = function(mediaPath, cb) {
    throw new Error('Not implemented');
};

MongoMediaProvider.prototype.exists = function(mediaPath, cb) {
    
    var db = pb.dbm[pb.config.db.name];
    GridStore.exist(db, mediaPath, cb);
};

MongoMediaProvider.prototype.delete = function(mediaPath, cb) {
    
    var db = pb.dbm[pb.config.db.name];
    GridStore.unlink(db, mediaPath, cb);
};
        
MongoMediaProvider.prototype.stat = function(mediaPath, cb) {
    
    var db  = pb.dbm[pb.config.db.name];
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
};

//exports
module.exports = MongoMediaProvider;
