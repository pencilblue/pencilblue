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

/**
 * The main driver file for PencilBlue.  Provides the function necessary to
 * start up the master and/or child processes.  In addition, it is responsible
 * for ensuring that all system services are avaialble by requiring the
 * "requirements.js" file.
 * @class PencilBlue
 * @constructor
 */
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
        PencilBlue.initCommandService,
        PencilBlue.initLibraries
    ];
	async.series(tasks, function(err, results) {
		if (util.isError(err)) {
			throw err;
		}
        pb.log.info('PencilBlue: Ready to run!');
	});
};

/**
 * Initializes the request handler.  This causes all system routes to be
 * registered.
 * @static
 * @method initRequestHandler
 * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
 */
PencilBlue.initRequestHandler = function(cb) {
	pb.RequestHandler.init();
	cb(null, true);
}

/**
 * Initializes the installed plugins.
 * @static
 * @method initPlugins
 * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
 */
PencilBlue.initPlugins = function(cb) {
    pb.plugins.initPlugins(cb);
};

/**
 * Attempts to initialize a connection pool to the core database
 * @static
 * @method initDBConnections
 * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
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
 * Initializes the HTTP server(s).  When SSL is enabled two servers are created.
 * One to handle incoming HTTP traffic and one to handle HTTPS traffic.
 * @static
 * @method initServer
 * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
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

/**
 * The function that handles normal server traffic.  The function ensures that
 * the incoming request is delegated out appropriately.  When SSL Termination
 * is in use if the 'x-forwarded-proto' header does equal 'https' then the
 * request is delegated to the handoff function so the request can be
 * redirected appropriately.
 * @static
 * @method onHttpConnect
 * @param {Request} req The incoming request
 * @param {Response} resp The outgoing response
 */
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

/**
 * Handles traffic that comes in for HTTP when SSL is enabled.  The request is
 * redirected to the appropriately protected HTTPS url.
 * @static
 * @method onHttpConnectForHandoff
 * @param {Request} req The incoming request
 * @param {Response} res The outgoing response
 */
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

/**
 * Initializes server registration.
 * @static
 * @method initServerRegistration
 * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
 */
PencilBlue.initServerRegistration = function(cb) {
	pb.ServerRegistration.init(cb);
};

/**
 * Initializes the command service by calling its "init" function.
 * @static
 * @method initCommandService
 * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
 */
PencilBlue.initCommandService = function(cb) {
    pb.CommandService.init(cb);
};

/**
 * Initializes the libraries service
 * @static
 * @method initLibraries
 * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
 */
PencilBlue.initLibraries = function(cb) {
    pb.libraries.init(cb);
};

//start system
pb.system.onStart(PencilBlue.init);
