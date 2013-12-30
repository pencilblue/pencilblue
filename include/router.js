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
    
    this.attemptDefaultRoute = function()
    {
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
                                // If requested file is JavaScript or CSS and isn't already minified, then we auto minify it
                                if((requestURL.substr(requestURL.lastIndexOf('.')) == '.js' || requestURL.substr(requestURL.lastIndexOf('.')) == '.css') && requestURL.indexOf('.min') == -1)
                                {
                                    minify.optimize(DOCUMENT_ROOT + '/public' + requestURL,
                                    {
                                        callback: function(data)
                                        {
                                            instance.writeResponse({content: data});
                                        }
                                    });
                                    
                                    return;
                                }
                                
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
    
    this.checkForSectionRoute = function(requestURL, output)
    {
        if(requestURL.lastIndexOf('.') > -1)
        {
            output(false);
            return;
        }
    
        var sections = requestURL.substr(1).split('/');
        
        if(sections.length > 2)
        {
            output(false);
        }
        else if(sections.length == 1)
        {
            getDBObjectsWithValues({object_type: 'section', url: sections[0], parent: null}, function(data)
            {
                if(data.length == 0)
                {
                    output(false);
                    return;
                }
                
                request.pencilblue_section = data[0]._id.toString();
                output(true);
            });
        }
        else
        {
            getDBObjectsWithValues({object_type: 'section', url: sections[0], parent: null}, function(data)
            {
                if(data.length == 0)
                {
                    output(false);
                    return;
                }
                
                var parentSectionID = data[0]._id;
                
                getDBObjectsWithValues({object_type: 'section', url: sections[1], parent: parentSectionID.toString()}, function(data)
                {
                    if(data.length == 0)
                    {
                        output(false);
                        return;
                    }
                    
                    request.pencilblue_section = data[0]._id.toString();
                    output(true);
                });
            });
        }
    }
    
    getDBObjectsWithValues({object_type: 'setting', key: 'active_theme'}, function(data)
    {
        if(data.length > 0)
        {
            fs.exists(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/controllers' + requestURL + '.js', function(exists)
            {
                if(exists)
                {
                    require(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/controllers' + requestURL).init(request, instance.writeResponse);
                }
                else
                {
                    // Is the request URL a folder?
                    fs.exists(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/controllers' + requestURL + '/index.js', function(exists)
                    {
                        if(exists)
                        {
                            require(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/controllers' + requestURL + '/index').init(request, instance.writeResponse);
                        }
                        else
                        {
                            // Is the request URL for a raw file?
                            fs.exists(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/public' + requestURL, function(exists)
                            {
                                if(exists)
                                {
                                    // If requested file is JavaScript or CSS and isn't already minified, then we auto minify it
                                    if((requestURL.substr(requestURL.lastIndexOf('.')) == '.js' || requestURL.substr(requestURL.lastIndexOf('.')) == '.css') && requestURL.indexOf('.min') == -1)
                                    {
                                        minify.optimize(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/public' + requestURL,
                                        {
                                            callback: function(data)
                                            {
                                                instance.writeResponse({content: data});
                                            }
                                        });
                                        
                                        return;
                                    }
                                
                                    fs.readFile(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/public' + requestURL, function(error, data)
                                    {
                                        if(error)
                                        {
                                            throw error;
                                        }
                                        instance.writeResponse({content: data});
                                    });
                                }
                                // If everything fails, see if the route is for a section
                                else
                                {
                                    instance.checkForSectionRoute(requestURL, function(isSection)
                                    {
                                        if(!isSection)
                                        {
                                            instance.attemptDefaultRoute();
                                            return;
                                        }
                                        
                                        fs.exists(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/controllers/section.js', function(exists)
                                        {
                                            if(!exists)
                                            {
                                                fs.exists(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/controllers/index.js', function(exists)
                                                {
                                                    if(!exists)
                                                    {
                                                        instance.attemptDefaultRoute();
                                                        return;
                                                    }
                                                    
                                                    require(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/controllers/index').init(request, instance.writeResponse);
                                                });  
                                                return;
                                            }
                                            
                                            require(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/controllers/section').init(request, instance.writeResponse);
                                        });
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
        else
        {
            instance.attemptDefaultRoute();
        }
    });
}
