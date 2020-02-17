/*
    Copyright (C) 2015  PencilBlue, LLC

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
'use strict';

//dependencies
const fs          = require('fs');
const http        = require('http');
const https       = require('https');
const async       = require('async');
const npm         = require('npm');
const util        = require('./include/util.js');
const ServerInitializer = require('./include/http/server_initializer.js');
const HtmlEncoder = require('htmlencode');


/**
 * The main driver file for PencilBlue.  Provides the function necessary to
 * start up the master and/or child processes.  In addition, it is responsible
 * for ensuring that all system services are available by requiring the
 * "requirements.js" file.
 * @class PencilBlue
 * @constructor
 */
function PencilBlue(config){

    /**
     *
     * @private
     * @static
     * @property pb
     * @type {Object}
     */
    var pb = require('./lib')(config);

    /**
     * The number of requests served by this instance
     * @private
     * @static
     * @property requestsServed
     * @type {Integer}
     */
    var requestsServed = 0;

    /**
     * To be called when the configuration is loaded.  The function is responsible
     * for triggered the startup of the HTTP connection listener as well as start a
     * connection pool to the core DB.
     * @method init
     */
    this.init = function(){
        var tasks = [
            util.wrapTimedTask(this, this.initModules, 'initModules'),
            util.wrapTimedTask(this, this.initRequestHandler, 'initRequestHandler'),
            util.wrapTimedTask(this, this.initDBConnections, 'initDBConnections'),
            util.wrapTimedTask(this, this.initDBIndices, 'initDBIndices'),
            util.wrapTimedTask(this, this.initServerRegistration, 'initServerRegistration'),
            util.wrapTimedTask(this, this.initCommandService, 'initCommandService'),
            util.wrapTimedTask(this, this.initSiteMigration, 'initSiteMigration'),
            util.wrapTimedTask(this, this.initSessions, 'initSessions'),
            util.wrapTimedTask(this, this.initMiddleware, 'initMiddleware'),
            util.wrapTimedTask(this, this.initPlugins, 'initPlugins'),
            util.wrapTimedTask(this, this.initSites, 'initSites'),
            util.wrapTimedTask(this, this.initLibraries, 'initLibraries'),
            util.wrapTimedTask(this, this.registerMetrics, 'registerMetrics'),
            util.wrapTimedTask(this, this.initServer, 'initServer')
        ];
        async.series(tasks, function(err, results) {
            if (util.isError(err)) {
                throw err;
            }
            pb.log.info('PencilBlue: Ready to run!');

            //print out stats
            if (pb.log.isDebug()) {
                var stats = results.reduce(function (obj, result) {
                    obj[result.name] = result.time;
                    obj.total += result.time;
                    return obj;
                }, {total: 0});
                pb.log.debug('Startup Stats (ms):\n%s', JSON.stringify(stats, null, 2));
            }
        });
    };

    /**
     * Ensures that any log messages by the NPM module are forwarded as output
     * to the system logs
     * @static
     * @method initLogWrappers
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    this.initModules = function(cb) {
        npm.on('log', function(message) {
            pb.log.info(message);
        });

        HtmlEncoder.EncodeType = 'numerical';

        pb.Localization.init(cb);
    };

    /**
     * Initializes the request handler.  This causes all system routes to be
     * registered.
     * @static
     * @method initRequestHandler
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    this.initRequestHandler = function(cb) {
        pb.RequestHandler.init();
        cb(null, true);
    };

    /**
     * Starts the session handler
     * @method initSessions
     * @param {Function} cb
     */
    this.initSessions = function(cb) {
        pb.session.start(cb);
    };

    /**
     * Registers all default middleware
     * @method initMiddleware
     * @param {function} cb (Error, boolean)
     */
    this.initMiddleware = function (cb) {
        //register default middleware
        pb.Middleware.getAll().forEach(function(middleware) {
            pb.Router.addMiddlewareAfterAll(middleware);
        });
        cb(null, true);
    };

    /**
     * Initializes the installed plugins.
     * @static
     * @method initPlugins
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    this.initPlugins = function(cb) {

        //initialize command listeners
        pb.PluginService.init();

        //initialize the plugins
        var pluginService = new pb.PluginService();
        pluginService.initPlugins(cb);
    };

    /**
     * Move a single tenant solution to a multi-tenant solution.
     * @static
     * @method initSiteMigration
     * @param {Function} cb - callback function
     */
    this.initSiteMigration = function(cb) {
        pb.SiteService.init();
        pb.dbm.processMigration(cb);
    };

    /**
     * Initializes site(s).
     * @method initSites
     * @static
     * @param {Function} cb - callback function
     */
    this.initSites = function(cb) {
        var siteService = new pb.SiteService();
        siteService.initSites(cb);
    };

    /**
     * Attempts to initialize a connection pool to the core database
     * @static
     * @method initDBConnections
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    this.initDBConnections = function(cb){
        //setup database connection to core database
        pb.dbm.getDb(pb.config.db.name, function(err, result){
            if (util.isError(err)) {
                return cb(err, false);
            }
            else if (!result.databaseName) {
                return cb(new Error("Failed to establish a connection to: "+pb.config.db.name), false);
            }

            pb.log.debug('PencilBlue: Established connection to DB: %s', result.databaseName);
            cb(null, true);
        });
    };

    /**
     * Checks to see if the process should verify that the indices are valid and in
     * place.
     * @static
     * @method initDBIndices
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    this.initDBIndices = function(cb) {
        if (pb.config.db.skip_index_check || !util.isArray(pb.config.db.indices)) {
            pb.log.info('PencilBlue: Skipping ensurance of indices');
            return cb(null, true);
        }

        pb.log.info('PencilBlue: Ensuring indices...');
        pb.dbm.processIndices(pb.config.db.indices, function(err/*, results*/) {
            cb(err, !util.isError(err));
        });
    };

    /**
     * Initializes the HTTP server(s).  When SSL is enabled two servers are created.
     * One to handle incoming HTTP traffic and one to handle HTTPS traffic.
     * @static
     * @method initServer
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    this.initServer = function(cb){

        //build server setup
        var self = this;
        var context = {
            config: pb.config,
            log: pb.log,
            onRequest: function(req, res) {
                self.onHttpConnect(req, res);
            },
            onHandoffRequest: function(req, res) {
                self.onHttpConnectForHandoff(req, res);
            }
        };
        var Initializer = pb.config.server.initializer || ServerInitializer;
        var initializer = new Initializer(pb);
        initializer.init(context, function(err, servers) {
            if (util.isError(err)) {
                return cb(err);
            }
            pb.server = servers.server;
            pb.handOffServer = servers.handOffServer;

            cb(err, true);
        });
    };

    /**
     * The function that handles normal server traffic.  The function ensures that
     * the incoming request is delegated out appropriately.  When SSL Termination
     * is in use if the 'x-forwarded-proto' header does equal 'https' then the
     * request is delegated to the handoff function so the request can be
     * redirected appropriately.
     * @static
     * @method onHttpConnect
     * @param {Request} req The incoming request
     * @param {Response} res The outgoing response
     */
    this.onHttpConnect = function(req, res){
        if (pb.log.isSilly()) {
            pb.log.silly('New Request: %s', (req.uid = util.uniqueId()));
        }

        //bump the counter for the instance
        requestsServed++;

        //check to see if we should inspect the x-forwarded-proto header for SSL
        //load balancers use this for SSL termination relieving the stress of SSL
        //computation on more powerful load balancers.
        if (pb.config.server.ssl.use_x_forwarded && req.headers['x-forwarded-proto'] !== 'https') {
            return this.onHttpConnectForHandoff(req, res);
        }

        //route the request
        (new pb.Router(req, res)).handle(req, res);
    };

    /**
     * Handles traffic that comes in for HTTP when SSL is enabled.  The request is
     * redirected to the appropriately protected HTTPS url.
     * @static
     * @method onHttpConnectForHandoff
     * @param {Request} req The incoming request
     * @param {Response} res The outgoing response
     */
    this.onHttpConnectForHandoff = function(req, res) {
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
    this.initServerRegistration = function(cb) {
        pb.ServerRegistration.getInstance().init(cb);
    };

    /**
     * Initializes the command service by calling its "init" function.
     * @static
     * @method initCommandService
     * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
     */
    this.initCommandService = function(cb) {
        pb.CommandService.getInstance().init(cb);
    };

    /**
     * Initializes the libraries service
     * @static
     * @method initLibraries
     * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
     */
    this.initLibraries = function(cb) {
        pb.LibrariesService.init(cb);
    };

    /**
     * Initializes the metric registrations to measure request counts
     * @static
     * @method registerMetrics
     * @param {Function} cb
     */
    this.registerMetrics = function(cb) {

        //total number of requests served
        pb.ServerRegistration.addItem('requests', function(callback) {
            callback(null, requestsServed);
        });

        //current requests
        pb.ServerRegistration.addItem('currentRequests', function(callback) {
            pb.server.getConnections(callback);
        });

        //analytics average
        pb.ServerRegistration.addItem('analytics', function(callback) {
            callback(null, pb.AnalyticsManager.getStats());
        });

        cb(null, true);
    };

    /**
     * Starts up the instance of PencilBlue
     * @method start
     */
    this.start = function() {
        var self = this;
        pb.system.registerSignalHandlers(true);
        pb.system.onStart(function(){
            self.init();
        });
    };
}

/**
 * The default entry point to a stand-alone instance of PencilBlue
 * @static
 * @method startInstance
 * @return {PencilBlue}
 */
PencilBlue.startInstance = function() {
    var Configuration = require('./include/config.js');
    var config        = Configuration.load();
    var pb            = new PencilBlue(config);
    pb.start();
    return pb;
};

//start system only when the module is called directly
if (require.main === module) {
    PencilBlue.startInstance();
}

//exports
module.exports = PencilBlue;
