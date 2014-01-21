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
        
        getContentSettings(function(contentSettings)
        {
            if(!contentSettings.allow_comments)
            {
                output({content: apiResponse(apiResponseCode.FAILURE, 'commenting not allowed')});
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
                    
                    initLocalization(request, session, function(localization)
                    {
                        var timestamp = getTimestampText(data.created, contentSettings.date_format, contentSettings.display_hours_minutes, contentSettings.time_format);
                        
                        data.timestamp = localize(['timestamp'], timestamp);
                    
                        output({content: apiResponse(apiResponseCode.SUCCESS, 'comment created' , data)});
                    });
                });
            });
        });
    });
}
