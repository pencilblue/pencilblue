/**
 * UploadMedia - Uploads photos and video to media folder
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
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
    
    var date = new Date();
    var monthDir = MEDIA_DIRECTORY + date.getFullYear() + '/';
    if(!fs.existsSync(monthDir)) {
        fs.mkdirSync(monthDir);
    }
    
    var uploadDirectory = monthDir + (date.getMonth() + 1) + '/';
    if(!fs.existsSync(uploadDirectory)) {
        fs.mkdirSync(uploadDirectory);
    }        
    
    var filename = '';
    var form = new formidable.IncomingForm();
    form.on('fileBegin', function(name, file) {
        filename = self.generateFilename(file.name);
        file.path = uploadDirectory + filename;
    });

    form.parse(this.req, function() {
    	
    	var content = {
			content: JSON.stringify({
				filename: '/media/' + date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + filename
			}),
			content_type: 'application/json'
		};
        cb(content);
        return;
    });
};

UploadMedia.prototype.generateFilename = function(originalFilename){
	var now = new Date();
	
	//calculate extension
	var ext = '';
	var extIndex = originalFilename.lastIndexOf('.');
	if (extIndex >= 0){
		ext = originalFilename.substr(extIndex);
	}
	
	//build file name
    return pb.utils.uniqueId() + '-' + now.getTime() + ext;
};

//exports
module.exports = UploadMedia;
