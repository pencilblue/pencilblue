/*

    Imports topics CSV
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var instance = this;

    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/topics', output);
            return;
        }
        
        var files = [];
        
        var form = new formidable.IncomingForm();
        form.on('file', function(field, file)
        {
            files.push(file);
        });
        form.parse(request, function()
        {
            fs.readFile(files[0].path, function(error, data)
            {
                if(error)
                {
                    formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/topics', output);
                    return;
                }
                
                var topics = data.toString().split(',');
                instance.saveTopic(topics, 0, request, session, output);
            });
        });
    });
}

this.saveTopic = function(topics, index, request, session, output)
{
    var instance = this;

    if(index >= topics.length)
    {
        session.success = '^loc_TOPICS_CREATED^';
            
        editSession(request, session, [], function(data)
        {        
            output({content: JSON.stringify({completed: true})});
        });
        
        return;
    }

    var topicDocument = createDocument('topic', {name: topics[index].trim()});
        
    getDBObjectsWithValues({object_type: 'topic', name: topicDocument['name']}, function(data)
    {
        if(data.length > 0)
        {
            index++;
            instance.saveTopic(topics, index, request, session, output);
            return;
        }
        
        createDBObject(topicDocument, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/topics', output);
                return;
            }
            
            index++;
            instance.saveTopic(topics, index, request, session, output);
        });
    });
}
