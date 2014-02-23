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

UploadMedia.init = function(request, output)
{
    var instance = this;

    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/media/manage_media', output);
            return;
        }
        
        var files = [];
        
        if(!fs.existsSync(DOCUMENT_ROOT + '/public/media/'))
        {
            fs.mkdirSync(DOCUMENT_ROOT + '/public/media/');
        }
        
        var date = new Date();
        if(!fs.existsSync(DOCUMENT_ROOT + '/public/media/' + date.getFullYear() + '/'))
        {
            fs.mkdirSync(DOCUMENT_ROOT + '/public/media/' + date.getFullYear() + '/');
        }
        
        var uploadDirectory = DOCUMENT_ROOT + '/public/media/' + date.getFullYear() + '/' + (date.getMonth() + 1) + '/';
        
        if(!fs.existsSync(uploadDirectory))
        {
            fs.mkdirSync(uploadDirectory);
        }        
        
        var form = new formidable.IncomingForm();
        var filename;
        form.on('fileBegin', function(name, file)
        {
            filename = UploadMedia.generateFilename(file.name);
            file.path = uploadDirectory + filename;
        });
        form.on('file', function(field, file)
        {
            files.push(file);
        });
        form.parse(request, function()
        {
            output({content: JSON.stringify({filename: '/media/' + date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + filename})});
            return;
        });
    });
};

UploadMedia.generateFilename = function(originalFilename)
{
    var characters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    
    var filename = '';
    while(filename.length < 8)
    {
        filename = filename.concat(characters[parseInt(Math.random() * characters.length)]);
    }
    var date = new Date();
    
    return filename + '_' + date.getTime() + originalFilename.substr(originalFilename.lastIndexOf('.'));
};

//exports
module.exports = UploadMedia;
