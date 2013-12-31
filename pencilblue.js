// A grouping of all require calls
global.pb = require('./include/requirements');

/**
 * To be called when the configuration is loaded.  The function is responsible 
 * for triggered the startup of the HTTP connection listener as well as start a 
 * connection pool to the core DB.
 */
var init = function(){
	
	//start core db
	initDBConnections();
	
	//start server
	initServer();
	
	//set event listeners
	registerSystemForEvents();
};

/**
 * Attempts to initialize a connection pool to the core database
 */
function initDBConnections(){
	//setup database connection to core database
	pb.dbm.getDB(pb.config.db.name).then(function(result){
		if (typeof result !== 'Error') {
			log.debug('Established connection to DB: ' + result.databaseName);
			mongoDB = result;
		}
		else {
			throw err;
		}
	});
}

/**
 * Initializes the server
 */
var server;
function initServer(){
	log.debug('Starting server...');
	pb.server = http.createServer(function(request, response){

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
	
	pb.server.listen(pb.config.sitePort, pb.config.siteIP);
	log.info(pb.config.siteName + ' running on ' + pb.config.siteRoot);
}

/**
 * Registers for process level events
 */
function registerSystemForEvents(){
	
	//shutdown hook
	process.openStdin();
	process.on('SIGINT', function () {
		log.info('Shutting down...');
	  	pb.dbm.shutdown();
	});
}

//start up sequence
//1. Load Requirements
//2. Load configuration
//3. Start connection to core DB
//4. Start HTTP Server
//5. Register for system events
init();

