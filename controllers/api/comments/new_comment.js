this.init = function(request, output)
{
    var instance = this;
 
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true}))
        {
            output({content: apiResponse(apiResponseCode.FAILURE, 'insufficient credentials')});
            return;
        }
    
        var post = getPostParameters(request);
        
        if(message = checkForRequiredParameters(post, ['article', 'content']))
        {
            output({content: apiResponse(apiResponseCode.FAILURE, 'parameters missing')});
            return;
        }
        
        getDBObjectsWithValues({object_type: 'article', _id: ObjectID(post['article'])}, function(data)
        {
            if(data.length == 0)
            {
                output({content: apiResponse(apiResponseCode.FAILURE, 'article does not exist')});
                return;
            }
            
            var commentDocument = createDocument('comment', post);
            commentDocument.commenter = session.user._id.toString();
            
            createDBObject(commentDocument, function(data)
            {
                if(data.length == 0)
                {
                    output({content: apiResponse(apiResponseCode.FAILURE, 'error saving')});
                    return;
                }
                
                output({content: apiResponse(apiResponseCode.SUCCESS, 'comment created' , JSON.stringify(commentDocument))});
            });
        });
    });
}
