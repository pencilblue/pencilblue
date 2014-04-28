// A grouping of all require calls
global.pb = require('./include/requirements');

/**
 * To be called when the configuration is loaded.  The function is responsible 
 * for triggered the startup of the HTTP connection listener as well as start a 
 * connection pool to the core DB.
 */
var init = function(){
	var tasks = [
         initRequestHandler,
         initDBConnections, 
         initServer, 
         function(cb) {
         	pb.plugins.initPlugins(cb);
         },
         registerSystemForEvents
     ];
	async.series(tasks, function(err, results) {
		if (util.isError(err)) {
			process.exit(1);
		}
	});
};

function initRequestHandler(cb) {
	pb.RequestHandler.init();
	cb(null, true);
}

/**
 * Attempts to initialize a connection pool to the core database
 */
function initDBConnections(cb){
	//setup database connection to core database
	pb.dbm.getDB(pb.config.db.name).then(function(result){
		if (util.isError(result)) {
			cb(result, false);
		}
		else if (!result.databaseName) {
			cb(new Error("Failed to establish a connection to: "+pb.config.db.name), false);
		}
		else {
			log.debug('Established connection to DB: ' + result.databaseName);
			mongoDB = result;
			cb(null, true);
		}
	});
};

/**
 * Initializes the server
 */
function initServer(cb){
	log.debug('Starting server...');
	
	try{
		pb.server = http.createServer(onHttpConnect);
		pb.server.listen(pb.config.sitePort, function() {
			log.info(pb.config.siteName + ' running on ' + pb.config.siteRoot);
			cb(null, true);
		});
	}
	catch(e) {
		cb(e, false);
	}
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
function registerSystemForEvents(cb){
	
	//shutdown hook
	try {
		process.openStdin();
		process.on('SIGINT', function () {
			pb.log.info('Shutting down...');
		  	pb.dbm.shutdown();
		  	pb.cache.quit();
		  	pb.session.shutdown();
		});
		cb(null, true);
	}
	catch(e) {
		cb(e, false);
	}
}

//start up sequence
//1. Load Requirements
//2. Load configuration
//3. Start connection to core DB
//4. Start HTTP Server
//5. Register for system events
init();

