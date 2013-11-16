this.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({redirect: SITE_ROOT});
            return;
        }
        
        var form = new formidable.IncomingForm({uploadDir: DOCUMENT_ROOT + '/tmp'});
        form.parse(request, function(error, fields, files)
        {
            if(error)
            {
                output({content: error.message});
            }
            
            console.log('got here');
        
            output({content: 'got here'});
        });
    
        //var post = getPostParameters(request);
        
        return;
        
        if(message = checkForRequiredParameters(post, ['name']))
        {
            formError(request, session, message, '/admin/content/topics', output);
            return;
        }
        if(session['user']['admin'] < 2)
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/topics', output);
            return;
        }
        
        var topicDocument = createDocument('topic', post);
        
        getDBObjectsWithValues({object_type: 'topic', name: topicDocument['name']}, function(data)
        {
            if(data.length > 0)
            {
                formError(request, session, '^loc_EXISTING_TOPIC^', '/admin/content/topics', output);
                return;
            }
            
            createDBObject(topicDocument, function(data)
            {
                if(data.length == 0)
                {
                    formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/topics', output);
                    return;
                }
                
                session.success = '^loc_TOPIC_CREATED^';
                
                editSession(request, session, [], function(data)
                {        
                    output({redirect: SITE_ROOT + '/admin/content/topics'});
                });
            });
        });
    });
}
