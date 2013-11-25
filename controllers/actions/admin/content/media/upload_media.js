this.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({redirect: SITE_ROOT});
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
        form.on('fileBegin', function(name, file)
        {
            file.path = uploadDirectory + file.name;
        });
        form.on('file', function(field, file)
        {
            files.push(file);
        });
        form.parse(request, function()
        {
            output({content: JSON.stringify({filename: '/media/' + date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + files[0].name})});
            return;
        });
    });
}
