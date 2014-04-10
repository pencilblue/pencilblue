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
			if (result.databaseName == undefined){
				throw new Error("Failed to establish a connection to: "+pb.config.db.name);
			}
			
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
function initServer(){
	log.debug('Starting server...');
	pb.server = http.createServer(onHttpConnect);
	
	pb.server.listen(pb.config.sitePort);
	log.info(pb.config.siteName + ' running on ' + pb.config.siteRoot);
}

function onHttpConnect(req, resp){
	if (pb.log.isSilly()) {
		req.uid = new ObjectID();
		pb.log.silly('New Request: '+req.uid);
	}
    var handler = new pb.RequestHandler(pb.server, req, resp);
    handler.handleRequest();
}

/**
 * Registers for process level events
 */
function registerSystemForEvents(){
	
	//shutdown hook
	process.openStdin();
	process.on('SIGINT', function () {
		pb.log.info('Shutting down...');
	  	pb.dbm.shutdown();
	  	pb.cache.quit();
	  	pb.session.shutdown();
	});
}

//start up sequence
//1. Load Requirements
//2. Load configuration
//3. Start connection to core DB
//4. Start HTTP Server
//5. Register for system events
init();

