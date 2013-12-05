/*

    Uploads photos and video to media folder
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var instance = this;

    getSession(request, function(session)
    {
        if(!userIsAuthorized({logged_in: true, admin_level: ACCESS_WRITER}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/media', output);
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
            filename = instance.generateFilename(file.name);
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
}

this.generateFilename = function(originalFilename)
{
    var characters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    
    var filename = '';
    while(filename.length < 8)
    {
        filename = filename.concat(characters[parseInt(Math.random() * characters.length)]);
    }
    var date = new Date();
    
    return filename + '_' + date.getTime() + originalFilename.substr(originalFilename.lastIndexOf('.'));
}
