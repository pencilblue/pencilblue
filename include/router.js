// This is the main router of the server app
global.Route = function(request, response)
{
	this.startTime = (new Date()).getTime();
    var requestURL = request.url;
    
    // Remove query parameters from the route URL
    if (requestURL.indexOf('?') > 0) {
        requestURL = requestURL.substr(0, requestURL.indexOf('?'));
    }
    
    // Add index to the ends of folder routes
    if (requestURL.charAt(requestURL.length - 1) == '/') {
        requestURL = '/index';
    }
    this.requestURL = requestURL;
    this.request    = request;
    this.response   = response;
};

Route.prototype.route = function(){
	var requestURL = this.requestURL;
	var request    = this.request;
	var instance   = this;
	
	pb.log.debug("Getting Active theme");
	pb.settings.get('active_theme', function(activeTheme) {
        
		if(activeTheme != null) {
			
        	pb.log.debug("Checking for controller");
        	var controllerPath = DOCUMENT_ROOT + '/plugins/themes/' + activeTheme + '/controllers' + requestURL + '.js';
            fs.exists(controllerPath, function(exists) {
            	
                if(exists)
                {
                	pb.log.debug("Loading controller");
                    require(DOCUMENT_ROOT + '/plugins/themes/' + activeTheme + '/controllers' + requestURL).init(request, instance.writeResponse);
                }
                else
                {
                    // Is the request URL a folder?
                	pb.log.debug("Checking for controller index");
                    fs.exists(DOCUMENT_ROOT + '/plugins/themes/' + activeTheme + '/controllers' + requestURL + '/index.js', function(exists)
                    {
                        if(exists)
                        {
                        	pb.log.debug("Loading controller index");
                            require(DOCUMENT_ROOT + '/plugins/themes/' + activeTheme + '/controllers' + requestURL + '/index').init(request, instance.writeResponse);
                        }
                        else
                        {
                            // Is the request URL for a raw file?
                        	pb.log.debug("Checking for raw file");
                            fs.exists(DOCUMENT_ROOT + '/plugins/themes/' + activeTheme + '/public' + requestURL, function(exists)
                            {
                                if(exists)
                                {
                                    // If requested file is JavaScript or CSS and isn't already minified, then we auto minify it
                                	pb.log.debug("Loading raw file");
                                    if((requestURL.substr(requestURL.lastIndexOf('.')) == '.js' || requestURL.substr(requestURL.lastIndexOf('.')) == '.css') && requestURL.indexOf('.min') == -1)
                                    {
                                        minify.optimize(DOCUMENT_ROOT + '/plugins/themes/' + activeTheme + '/public' + requestURL,
                                        {
                                            callback: function(data)
                                            {
                                                instance.writeResponse({content: data});
                                            }
                                        });
                                        
                                        return;
                                    }
                                
                                    fs.readFile(DOCUMENT_ROOT + '/plugins/themes/' + activeTheme + '/public' + requestURL, function(error, data)
                                    {
                                        if(error)
                                        {
                                            throw error;
                                        }
                                        instance.writeResponse({content: data});
                                    });
                                }
                                // If everything fails, see if the route is for a section or article
                                else
                                {
                                	pb.log.debug("Checking for article or page route");
                                    instance.checkForArticleOrPageRoute(requestURL, function(isArticleOrPage)
                                    {
                                        if(!isArticleOrPage)
                                        {
                                        	pb.log.debug("Checking for section route");
                                            instance.checkForSectionRoute(requestURL, function(isSection)
                                            {
                                                if(!isSection)
                                                {
                                                	pb.log.debug("Not a section attempting default route");
                                                    instance.attemptDefaultRoute();
                                                    return;
                                                }
                                                
                                                fs.exists(DOCUMENT_ROOT + '/plugins/themes/' + activeTheme + '/controllers/section.js', function(exists)
                                                {
                                                    if(!exists)
                                                    {
                                                        fs.exists(DOCUMENT_ROOT + '/plugins/themes/' + activeTheme + '/controllers/index.js', function(exists)
                                                        {
                                                            if(!exists)
                                                            {
                                                                require(DOCUMENT_ROOT + '/controllers/index').init(request, instance.writeResponse);
                                                                return;
                                                            }
                                                            
                                                            require(DOCUMENT_ROOT + '/plugins/themes/' + activeTheme + '/controllers/index').init(request, instance.writeResponse);
                                                        });  
                                                        return;
                                                    }
                                                    
                                                    require(DOCUMENT_ROOT + '/plugins/themes/' + activeTheme + '/controllers/article').init(request, instance.writeResponse);
                                                });
                                            });
                                            return;
                                        }
                                        
                                        fs.exists(DOCUMENT_ROOT + '/plugins/themes/' + activeTheme + '/controllers/article.js', function(exists)
                                        {
                                            if(!exists)
                                            {
                                                fs.exists(DOCUMENT_ROOT + '/plugins/themes/' + activeTheme + '/controllers/index.js', function(exists)
                                                {
                                                    if(!exists)
                                                    {
                                                        require(DOCUMENT_ROOT + '/controllers/index').init(request, instance.writeResponse);
                                                        return;
                                                    }
                                                    
                                                    require(DOCUMENT_ROOT + '/plugins/themes/' + activeTheme + '/controllers/index').init(request, instance.writeResponse);
                                                });  
                                                return;
                                            }
                                            
                                            require(DOCUMENT_ROOT + '/plugins/themes/' + activeTheme + '/controllers/section').init(request, instance.writeResponse);
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
};

Route.prototype.writeResponse = function(data) {
    if(typeof data.redirect != "undefined") {
        this.response.statusCode = 302;
        this.response.setHeader("Location", data.redirect);
        this.response.end();
        return;
    }

    var responseHead = null;
    if (typeof data.code != "undefined") {
        responseHead = new ResponseHead(this.request, this.response, data.code, data.cookie);
        delete statusCode;
    }
    else {
        responseHead = new ResponseHead(this.request, this.response, 200, data.cookie);
    }
    
    if (!responseHead.binary) {
    	this.response.end(data.content.toString());
    }
    else {
    	this.response.end(data.content, 'binary');
    }
    pb.log.debug("Response Time: "+(new Date().getTime() - this.startTime)+"ms URL="+this.request.url);
};


Route.prototype.attemptDefaultRoute = function() {
	var requestURL = this.requestURL;
	var instance   = this;
	
    // Does the page file exist? If so, load it?
    fs.exists(DOCUMENT_ROOT + '/controllers' + requestURL + '.js', function(exists)
    {
        if(exists)
        {
            require(DOCUMENT_ROOT + '/controllers' + requestURL).init(instance.request, instance.writeResponse.bind(instance));
        }
        else
        {
            // Is the request URL a folder?
        	pb.log.debug("Default Route: Check for folder: "+requestURL);
            fs.exists(DOCUMENT_ROOT + '/controllers' + requestURL + '/index.js', function(exists)
            {
                if(exists)
                {
                	pb.log.debug("Default Route: Loading: "+requestURL+"/index - "+(instance.constructor));
                    require(DOCUMENT_ROOT + '/controllers' + requestURL + '/index').init(instance.request, instance.writeResponse.bind(instance));
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
                        	pb.log.debug("I give up I can't find it 404 it is");
                            require(DOCUMENT_ROOT + '/controllers/error/404').init(instance.request, instance.writeResponse.bind(instance));
                        }
                    });
                }
            });
        }
    });
};


Route.prototype.checkForSectionRoute = function(requestURL, output) {
    if(requestURL.lastIndexOf('.') > -1)  {
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
};


Route.prototype.checkForArticleOrPageRoute = function(requestURL, output)
{
    if(requestURL.lastIndexOf('.') > -1)
    {
        output(false);
        return;
    }
    
    if(requestURL.indexOf('/article/') > -1)
    {
        getDBObjectsWithValues({object_type: 'article', url: requestURL.substr(requestURL.indexOf('/article/') + 9)}, function(data)
        {
            if(data.length == 0)
            {
                output(false);
                return;
            }
            
            request.pencilblue_article = data[0]._id.toString();
            output(true);
        });
    }
    else if(requestURL.indexOf('/page/') > -1)
    {
        getDBObjectsWithValues({object_type: 'page', url: requestURL.substr(requestURL.indexOf('/page/') + 6)}, function(data)
        {
            if(data.length == 0)
            {
                output(false);
                return;
            }
            
            request.pencilblue_page = data[0]._id.toString();
            output(true);
        });
    }
    else
    {
        output(false);
    }
};

