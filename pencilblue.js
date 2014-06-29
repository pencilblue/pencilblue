/*
    Copyright (C) 2014  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
        if (pb.config.server.ssl.enabled) {

            //set SSL options
            var options = {
                key: fs.readFileSync(pb.config.server.ssl.key),
                cert: fs.readFileSync(pb.config.server.ssl.cert),
                ca: fs.readFileSync(pb.config.server.ssl.chain),
            };
            pb.server = https.createServer(options, PencilBlue.onHttpConnect);

            //create an http server that redirects to SSL site
            pb.handOffServer = http.createServer(PencilBlue.onHttpConnectForHandoff);
            pb.handOffServer.listen(pb.config.server.ssl.handoff_port, function() {
                log.info('PencilBlue: Handoff HTTP server running on port: %d', pb.config.server.ssl.handoff_port);
            });
        }
        else {
            pb.server = http.createServer(PencilBlue.onHttpConnect);
        }
		pb.server.listen(pb.config.sitePort, function() {
			log.info('PencilBlue: %s running at site root [%s] on port [%d]', pb.config.siteName, pb.config.siteRoot, pb.config.sitePort);
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

    //check to see if we should inspect the x-forwarded-proto header for SSL
    //load balancers use this for SSL termination relieving the stress of SSL
    //computation on more powerful load balancers.  For me it is a giant pain
    //in the ass when all I want to do is simple load balancing.
    if (pb.config.server.ssl.use_x_forwarded && req.headers['x-forwarded-proto'] !== 'https') {
        PencilBlue.onHttpConnectForHandoff(req, resp);
        return;
    }

    //route the request
    var handler = new pb.RequestHandler(pb.server, req, resp);
    handler.handleRequest();
};

PencilBlue.onHttpConnectForHandoff = function(req, res) {
    var host = req.headers.host;
    if (host) {
        var index = host.indexOf(':');
        if (index >= 0) {
            host = host.substring(0, index);
        }
    }
    if (pb.config.server.ssl.use_handoff_port_in_redirect) {
        host += ':'+pb.config.sitePort;
    }

    res.writeHead(301, { "Location": "https://" + host + req.url });
    res.end();
};

PencilBlue.initServerRegistration = function() {
	pb.ServerRegistration.init();
};

//start system
pb.system.onStart(PencilBlue.init);
