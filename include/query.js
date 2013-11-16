// Query parameters are returned as an associative array
global.getQueryParameters = function(request)
{
    this.urlParts = url.parse(request.url, true);
    return this.urlParts.query;
}

global.getPostParameters = function(request)
{
    var postString = request.headers['post'];
    this.urlParts = url.parse('?' + postString, true);
    return this.urlParts.query;
}

// Todo: got to be a better way to do this + need to add binary file support
global.getMultiPartPostParameters = function(request)
{
    var postString = request.headers['post'];
    var postSeparator = postString.substr(0, postString.indexOf('Content-Disposition') - 2);
    var postElements = postString.split(postSeparator);
    postElements.splice(0, 1);
    postElements.splice(postElements.length - 1);
    
    var post = {};
    
    for(var i = 0; i < postElements.length; i++)
    {
        postElements[i] = postElements[i].substr(postElements[i].indexOf('; name') + 8);
        if(postElements[i].indexOf('filename') == -1)
        {
            post[postElements[i].substr(0, postElements[i].indexOf('"'))] = {value: postElements[i].substr(postElements[i].indexOf('"') + 1).trim()};
        }
        else
        {
            var key = postElements[i].substr(0, postElements[i].indexOf('"'));
            
            postElements[i] = postElements[i].substr(postElements[i].indexOf('; filename') + 12);
            var filename = postElements[i].substr(0, postElements[i].indexOf('"'));
            
            postElements[i] = postElements[i].substr(postElements[i].indexOf('Content-Type:') + 14);
            var mimeTypes = postElements[i].substr(0, postElements[i].indexOf('\r'));
            var value = postElements[i].substr(postElements[i].indexOf('\r')).replace(/(\r\n|\n|\r)/gm,"");
            
            post[key] = {value: value, mime_types: mimeTypes, filename: filename};
        }
    }
    
    return post;
}

global.checkForRequiredParameters = function(queryObject, requiredParameters, multiPart)
{
    if(typeof multiPart === 'undefined')
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
    }
    else
    {
        for(var i = 0; i < requiredParameters.length; i++)
        {
            if(typeof queryObject[requiredParameters[i]] === 'undefined')
            {
                return '^loc_FORM_INCOMPLETE^';
            }
            else if(queryObject[requiredParameters[i]].value.length == 0)
            {
                return '^loc_FORM_INCOMPLETE^';
            }
        }
        
        if(queryObject['password'] && queryObject['confirm_password'])
        {
            if(queryObject['password'].value != queryObject['confirm_password'].value)
            {
                return '^loc_PASSWORD_MISMATCH^';
            }
        }
    }
    
    return null;
}
