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
    var sresult  = null;
    var form     = new formidable.IncomingForm();
    form.onPart  = function(part) {
        
        //we don't care about anything else that got posted just the file so 
        //let formidable parse it but we'll ignore it.
        if (!part.filename) {
            form.handlePart(part);
            return;
        }
        
        sresult = mservice.createContentWriteStream(part.filename);
        part.addListener('data', function(data) {
            sresult.stream.write(data);
        });
    }

    //parse the form out and let us know when its done
    form.parse(this.req, function() {

        //close out the stream
        if (sresult.stream) {
            sresult.stream.end();
        }
        
        //write the response
    	var content = {
			content: JSON.stringify({
				filename: sresult.mediaPath
			}),
			content_type: 'application/json'
		};
        cb(content);
        return;
    });
};

//exports
module.exports = UploadMedia;
