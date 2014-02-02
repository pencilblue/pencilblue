// Query parameters are returned as an associative array
global.getQueryParameters = function(request)
{
    this.urlParts = url.parse(request.url, true);
    return this.urlParts.query;
};

global.getPostParameters = function(request)
{
    var postString = decodeURIComponent(request.headers['post']);
    this.urlParts = url.parse('?' + postString, true);
    return this.urlParts.query;
};

global.checkForRequiredParameters = function(queryObject, requiredParameters)
{
    for(var i = 0; i < requiredParameters.length; i++)
    {
        if(typeof queryObject[requiredParameters[i]] === 'undefined')
        {
            return '^loc_FORM_INCOMPLETE^';
        }
        else if(queryObject[requiredParameters[i]].length == 0)
        {
            return '^loc_FORM_INCOMPLETE^';
        }
    }
    
    if(queryObject['password'] && queryObject['confirm_password'])
    {
        if(queryObject['password'] != queryObject['confirm_password'])
        {
            return '^loc_PASSWORD_MISMATCH^';
        }
    }
    
    return null;
};
