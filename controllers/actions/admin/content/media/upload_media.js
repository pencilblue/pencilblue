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

/**
 * Uploads a media file to the system
 */

function UploadMedia(){}

//setup
var MEDIA_DIRECTORY = DOCUMENT_ROOT + '/public/media/';
if(!fs.existsSync(MEDIA_DIRECTORY)){
    fs.mkdirSync(MEDIA_DIRECTORY);
}

//inheritance
util.inherits(UploadMedia, pb.BaseController);

UploadMedia.prototype.render = function(cb) {
	var self  = this;
    
    var mservice = new pb.MediaService();
    var fpart    = null;
    var sresult  = null;
    var error    = null;
    var fdata    = '';
    var form     = new formidable.IncomingForm();

    //parse the form out and let us know when its done
    form.parse(this.req, function(err, fields, files) {
        if (util.isError(error)) {
            return self.reqHandler.serveError(error);
        }
        
        var keys = Object.keys(files);
        if (keys.length === 0) {
            return self.serveError(new Error('No file inputs were submitted'));
        }
        var fileDescriptor = files[keys[0]];
        
        var stream = fs.createReadStream(fileDescriptor.path);
        mservice.setContentStream(stream, fileDescriptor.name, function(err, sresult) {
            if (util.isError(err)) {
                return self.reqHandler.serveError(err);   
            }

            //write the response
            var content = {
                content: JSON.stringify({
                    filename: sresult.mediaPath
                }),
                content_type: 'application/json'
            };
            cb(content);
        });
        return;
    });
};

//exports
module.exports = UploadMedia;
