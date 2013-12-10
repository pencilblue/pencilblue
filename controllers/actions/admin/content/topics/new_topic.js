this.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({redirect: pb.config.siteRoot});
            return;
        }
    
        var post = getPostParameters(request);
        
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
                    output({redirect: pb.config.siteRoot + '/admin/content/topics'});
                });
            });
        });
    });
}
