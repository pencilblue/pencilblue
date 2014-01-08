this.init = function(request, output)
{
    var instance = this;
 
    getSession(request, function(session)
    {
        var get = getQueryParameters(request);
        
        if(message = checkForRequiredParameters(get, ['username']))
        {
            output({content: apiResponse(apiResponseCode.FAILURE, 'username missing from request')});
            return;
        }
        
        getDBObjectsWithValues({object_type: 'user', username: get['username'].toLowerCase()}, function(data)
        {
            if(data.length == 0)
            {
                output({content: apiResponse(apiResponseCode.SUCCESS, get['username'] + ' is available', true)});
                return;
            }
            
            output({content: apiResponse(apiResponseCode.SUCCESS, get['username'] + ' is not available', false)});
        });
    });
}
