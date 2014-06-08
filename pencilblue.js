// A grouping of all require calls
global.pb = require('./include/requirements');

function PencilBlue(){}

/**
 * To be called when the configuration is loaded.  The function is responsible 
 * for triggered the startup of the HTTP connection listener as well as start a 
 * connection pool to the core DB.
 */
PencilBlue.init = function(){
	var tasks = [
         PencilBlue.initRequestHandler,
         PencilBlue.initDBConnections, 
         PencilBlue.initServer, 
         PencilBlue.initPlugins,
         PencilBlue.initServerRegistration,
         PencilBlue.registerSystemForEvents
     ];
	async.series(tasks, function(err, results) {
		if (util.isError(err)) {
			throw err;
		}
        pb.log.info('PencilBlue: Ready to run!');
	});
};

PencilBlue.initRequestHandler = function(cb) {
	pb.RequestHandler.init();
	cb(null, true);
}

PencilBlue.initPlugins = function(cb) {
    pb.plugins.initPlugins(cb);
};

/**
 * Attempts to initialize a connection pool to the core database
 */
PencilBlue.initDBConnections = function(cb){
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
PencilBlue.initServer = function(cb){
	log.debug('Starting server...');
	
	try{
		pb.server = http.createServer(PencilBlue.onHttpConnect);
		pb.server.listen(pb.config.sitePort, function() {
			log.info(pb.config.siteName + ' running on ' + pb.config.siteRoot);
			cb(null, true);
		});
	}
	catch(e) {
		cb(e, false);
	}
}

PencilBlue.onHttpConnect = function(req, resp){
	if (pb.log.isSilly()) {
		req.uid = new ObjectID();
		pb.log.silly('New Request: '+req.uid);
	}
    var handler = new pb.RequestHandler(pb.server, req, resp);
    handler.handleRequest();
}

PencilBlue.initServerRegistration = function() {
	pb.ServerRegistration.init();
}

//start system
pb.system.onStart(PencilBlue.init);
