// This is the main router of the server app
global.Route = function(request, response)
{
    var requestURL = request.url;
    var instance = this;
    
    // Remove query parameters from the route URL
    if(requestURL.indexOf('?') != -1)
    {
        requestURL = requestURL.substr(0, requestURL.indexOf('?'));
    }
    
    // Add index to the ends of folder routes
    if(requestURL.charAt(requestURL.length - 1) == '/')
    {
        requestURL = '/index';
    }
    
    this.writeResponse = function(data)
    {
        if(typeof data.redirect != "undefined")
        {
            response.statusCode = 302;
            response.setHeader("Location", data.redirect);
            response.end();
            return;
        }
    
        if(typeof data.code != "undefined")
        {
            var responseHead = new ResponseHead(request, response, data.code, data.cookie);
            delete statusCode;
        }
        else
        {
            var responseHead = new ResponseHead(request, response, 200, data.cookie);
        }
        
        if(!responseHead.binary)
        {
            response.end(data.content.toString());
        }
        else
        {
            response.end(data.content, 'binary');
        }
    }
    
    // Does the page file exist? If so, load it?
    fs.exists(DOCUMENT_ROOT + '/controllers' + requestURL + '.js', function(exists)
    {
        if(exists)
        {
            require(DOCUMENT_ROOT + '/controllers' + requestURL).init(request, instance.writeResponse);
        }
        else
        {
            // Is the request URL a folder?
            fs.exists(DOCUMENT_ROOT + '/controllers' + requestURL + '/index.js', function(exists)
            {
                if(exists)
                {
                    require(DOCUMENT_ROOT + '/controllers' + requestURL + '/index').init(request, instance.writeResponse);
                }
                else
                {
                    // Is the request URL for a raw file?
                    fs.exists(DOCUMENT_ROOT + '/public' + requestURL, function(exists)
                    {
                        if(exists)
                        {
                            fs.readFile(DOCUMENT_ROOT + '/public' + requestURL, function(error, data)
                            {
                                if(error)
                                {
                                    throw error;
                                }
                                instance.writeResponse({content: data});
                            });
                        }
                        // If everything fails, throw a 404
                        else
                        {
                            require(DOCUMENT_ROOT + '/controllers/error/404').init(request, instance.writeResponse);
                        }
                    });
                }
            });
        }
    });
}
