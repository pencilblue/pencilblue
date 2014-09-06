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
var os = require('os');

/**
 *
 * @class FsMediaProvider
 * @constructor
 */
function FsMediaProvider(parentDir) {
    this.parentDir = parentDir || pb.config.media.parent_dir;
};

FsMediaProvider.prototype.getStream = function(mediaPath, cb) {
    var ap = FsMediaProvider.getMediaPath(this.parentDir, mediaPath);
    cb(null, fs.createReadStream(ap));
};

FsMediaProvider.prototype.get = function(mediaPath, cb) {
    var ap = FsMediaProvider.getMediaPath(this.parentDir, mediaPath);
    fs.readFile(ap, cb);
};

FsMediaProvider.prototype.setStream = function(stream, mediaPath, cb) {
    
    this.createWriteStream(mediaPath, function(err, fileStream) {
        if (util.isError(err)) {
            return cb(err);
        }
        
        pb.log.silly('FsMediaProvider: Piping stream to [%s]', mediaPath);
        stream.pipe(fileStream);
        stream.on('end', cb);
        stream.on('error', cb);
    });
};

FsMediaProvider.prototype.set = function(fileDataStrOrBuff, mediaPath, cb) {
    var ap = FsMediaProvider.getMediaPath(this.parentDir, mediaPath);
    this.mkdirs(ap, function(err) {
        if (util.isError(err)) {
            return cb(err);
        }
        fs.writeFile(ap, fileDataStrOrBuff, cb);
    });
};

FsMediaProvider.prototype.createWriteStream = function(mediaPath, cb) {
    var ap = FsMediaProvider.getMediaPath(this.parentDir, mediaPath);
    this.mkdirs(ap, function(err) {
        if(util.isError(err)) {
            return cb(err);
        }
        
        try {
            cb(null, fs.createWriteStream(ap));
        }
        catch(e) {
            cb(e);
        }
    });
};

FsMediaProvider.prototype.exists = function(mediaPath, cb) {
    var ap = FsMediaProvider.getMediaPath(this.parentDir, mediaPath);
    fs.exists(ap, function(exists) {
        cb(null, exists);
    });
};

FsMediaProvider.prototype.delete = function(mediaPath, cb) {
    var ap = FsMediaProvider.getMediaPath(this.parentDir, mediaPath);
    fs.exists(ap, function(exists) {
        fs.unlink(ap, cb);
    });
};
        
FsMediaProvider.prototype.stat = function(mediaPath, cb) {
    var ap = FsMediaProvider.getMediaPath(this.parentDir, mediaPath);
    fs.stat(ap, cb);
};

FsMediaProvider.prototype.mkdirs = function(absoluteFilePath, cb) {
    
    var pieces = absoluteFilePath.split(path.sep);
    pb.log.silly('FsMediaProvider: Ensuring directories exist for path: %s', absoluteFilePath);
    
    var curr      = '';
    var isWindows = os.type().toLowerCase().indexOf('windows') !== -1;
    var tasks     = pb.utils.getTasks(pieces, function(pieces, i) {
        return function(callback) {
            
            //we need to skip the first one bc it will probably be empty and we 
            //want to skip the last one because it will probably be the file 
            //name not a directory.
            var p = pieces[i];
            if (p.length === 0 || i >= pieces.length - 1) {
                return callback();   
            }
            
            curr += (isWindows && i === 0 ? '' : path.sep) + p;
            fs.exists(curr, function(exists) {
                if (exists) {
                    pb.log.silly('FsMediaProvider: Skipping creation of [%s] because it already exists', curr);
                    return callback();
                }
            
                pb.log.silly('FsMediaProvider: Creating directory [%s]', curr);
                fs.mkdir(curr, callback);
            });
        };
    });
    async.series(tasks, cb);
};
    
FsMediaProvider.getMediaPath = function(parentDir, mediaPath) {
  
    var absolutePath = '';
    if (parentDir.indexOf('/') !== 0) {
        
        //we have a relative path meant to be from the project directory
        absolutePath = path.join(DOCUMENT_ROOT, parentDir, mediaPath);
    }
    else {
        absolutePath = path.join(parentDir, mediaPath);
    }
    return absolutePath;
};

//exports
module.exports = FsMediaProvider;
