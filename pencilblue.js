// A grouping of all require calls
require('./include/requirements');

/**
 * To be called when the configuration is loaded.  The function is responsible 
 * for triggered the startup of the HTTP connection listener as well as start a 
 * connection pool to the core DB.
 */
var onConfigurationLoad = function(){
	
	//start core db
	//TODO fill this in when branch DAO_WRAPPER is merged
	
	//start server
	initServer();
};

/**
 * Initializes the server
 */
var server;
function initServer(){
	console.log('Starting server...');
	server = http.createServer(function(request, response){

	    // /include/router.js
	    var route = new Route(request, response);
	    
	    if(request.headers.cookie)
	    {
	        var parsedCookies = {};
	        var cookieParameters = request.headers.cookie.split(';');
	        for(var i = 0; i < cookieParameters.length; i++)
	        {
	            var cookieParameter = cookieParameters[i].split('=');
	            parsedCookies[cookieParameter[0]] = cookieParameter[1];
	        }
	        request.headers['parsed_cookies'] = parsedCookies;
	    }
	    
	    if(request.headers['content-type'])
	    {
	        if(request.headers['content-type'].indexOf('multipart/form-data') > -1)
	        {
	            return;
	        }
	    }
	    
	    request.on('data', function(chunk)
	    {
	        if(typeof request.headers['post'] == 'undefined')
	        {
	            request.headers['post'] = '';
	        }
	        request.headers['post'] += chunk;
	    });
	});
	
	server.listen(SITE_PORT, SITE_IP);
	console.log(SITE_NAME + ' running on ' + SITE_ROOT);
}

//start up sequence
//1. Load Requirements
//2. Load configuration
//3. Start connection to core DB
//4. Start HTTP Server
loadConfiguration(onConfigurationLoad);