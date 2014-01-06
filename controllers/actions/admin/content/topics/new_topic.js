/*

    Interface for adding a new topic
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/topics', output);
            return;
        }
    
        var post = getPostParameters(request);
        
        if(message = checkForRequiredParameters(post, ['name']))
        {
            formError(request, session, message, '/admin/content/topics', output);
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
                
                session.success = topicDocument.name + ' ^loc_CREATED^';
                
                editSession(request, session, [], function(data)
                {        
                    output({redirect: pb.config.siteRoot + '/admin/content/topics'});
                });
            });
        });
    });
}
