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

//TODO [1.0] Hook-up monitoring solution

//dependencies
var _ = require('lodash');
var async       = require('async');
var Configuration = require('./include/config.js');
var fs          = require('fs');
var HtmlEncoder = require('htmlencode');
var http        = require('http');
var https       = require('https');
var Lib = require('./lib');
var LogFactory = require('./include/utils/logging');
var npm         = require('npm');
var Q = require('q');
var ServerInitializer = require('./include/http/server_initializer.js');
var System = require('./include/system/system');
var TaskUtils = require('./lib/utils/taskUtils');
var uuid = require('uuid');

/**
 * The main driver file for PencilBlue.  Provides the function necessary to
 * start up the master and/or child processes.  In addition, it is responsible
 * for ensuring that all system services are available by requiring the
 * "requirements.js" file.
 * @class PencilBlue
 * @constructor
 */
class PencilBlue {
    constructor () {

        /**
         * @property pb
         * @type {Object}
         */
        this.pb = Lib();

        /**
         * The number of requests served by this instance
         * @property requestsServed
         * @type {Integer}
         */
        this.requestsServed = 0;

        /**
         *
         */
        this.log = LogFactory.newInstance('PencilBlue');
    }

    /**
     * To be called when the configuration is loaded.  The function is responsible
     * for triggered the startup of the HTTP connection listener as well as start a
     * connection pool to the core DB.
     * @method init
     */
    init (){
        var tasks = [
            TaskUtils.wrapTimedTask(this, this.initModules, 'initModules'),
            TaskUtils.wrapTimedTask(this, this.initRequestHandler, 'initRequestHandler'),
            TaskUtils.wrapTimedPromiseTask(this, this.initDBConnections, 'initDBConnections'),
            TaskUtils.wrapTimedPromiseTask(this, this.initDBIndices, 'initDBIndices'),
            TaskUtils.wrapTimedTask(this, this.initServerRegistration, 'initServerRegistration'),
            TaskUtils.wrapTimedTask(this, this.initCommandService, 'initCommandService'),
            TaskUtils.wrapTimedTask(this, this.initSiteMigration, 'initSiteMigration'),
            TaskUtils.wrapTimedTask(this, this.initSessions, 'initSessions'),
            TaskUtils.wrapTimedTask(this, this.initPlugins, 'initPlugins'),
            TaskUtils.wrapTimedTask(this, this.initSites, 'initSites'),
            TaskUtils.wrapTimedTask(this, this.initLibraries, 'initLibraries'),
            TaskUtils.wrapTimedTask(this, this.registerMetrics, 'registerMetrics'),
            TaskUtils.wrapTimedTask(this, this.initServer, 'initServer')
        ];

        var self = this;
        async.series(tasks, function(err, results) {
            if (_.isError(err)) {
                console.log(err.stack);
                throw err;
            }
            self.log.info('Ready to run!');

            //print out stats
            if (self.log.isDebug()) {
                var stats = results.reduce(function (obj, result) {
                    obj[result.name] = result.time;
                    obj.total += result.time;
                    return obj;
                }, {total: 0});
                self.log.debug('Startup Stats (ms):\n%s', JSON.stringify(stats, null, 2));
            }
        });
    }

    /**
     * Ensures that any log messages by the NPM module are forwarded as output
     * to the system logs
     * @static
     * @method initLogWrappers
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    initModules (cb) {
        var self = this;
        npm.on('log', function(message) {
            self.log.info(message);
        });

        HtmlEncoder.EncodeType = 'numerical';

        this.pb.Localization.init(cb);
    }

    /**
     * Initializes the request handler.  This causes all system routes to be
     * registered.
     * @static
     * @method initRequestHandler
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    initRequestHandler (cb) {
        this.pb.RequestHandler.init();
        cb(null, true);
    }

    /**
     * Starts the session handler
     * @method initSessions
     * @param {Function} cb
     */
    initSessions (cb) {
        this.pb.session.start(cb);
    }

    /**
     * Initializes the installed plugins.
     * @static
     * @method initPlugins
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    initPlugins (cb) {

        //initialize command listeners
        this.pb.PluginService.init();

        //initialize the plugins
        var pluginService = new this.pb.PluginService();
        pluginService.initPlugins(cb);
    }

    /**
     * Move a single tenant solution to a multi-tenant solution.
     * @static
     * @method initSiteMigration
     * @param {Function} cb - callback function
     */
    initSiteMigration (cb) {
        this.pb.SiteService.init();
        this.pb.DbManager.processMigration(cb);
    }

    /**
     * Initializes site(s).
     * @method initSites
     * @static
     * @param {Function} cb - callback function
     */
    initSites (cb) {
        var siteService = new this.pb.SiteService();
        siteService.initSites(cb);
    }

    /**
     * Attempts to initialize a connection pool to the core database
     * @static
     * @method initDBConnections
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    initDBConnections () {
        var self = this;

        //setup database connection to core database
        this.pb.DbManager.init();
        return this.pb.DbManager.getDb(Configuration.active.db.name).then(function(result){
            if (!result.databaseName) {
                var err = new Error('Failed to establish a connection to: ' + Configuration.active.db.name);
                return Q.reject(err, false);
            }

            self.log.debug('PencilBlue: Established connection to DB: %s', result.databaseName);
            return result;
        });
    }

    /**
     * Checks to see if the process should verify that the indices are valid and in
     * place.
     * @static
     * @method initDBIndices
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    initDBIndices () {
        var config = Configuration.active;
        if (config.db.skip_index_check || !Array.isArray(config.db.indices)) {
            this.log.info('Skipping indices check');
            return Q.resolve(true);
        }

        this.log.info('Verifying indices...');
        return this.pb.DbManager.processIndices(config.db.indices)
            .then(function() {
                return Q.resolve(true);
            });
    }

    /**
     * Initializes the HTTP server(s).  When SSL is enabled two servers are created.
     * One to handle incoming HTTP traffic and one to handle HTTPS traffic.
     * @static
     * @method initServer
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    initServer (cb){
        var self = this;

        //register default middleware
        this.pb.Middleware.getAll().forEach(function(middleware) {
            self.pb.Router.addMiddlewareAfterAll(middleware);
        });

        //build server setup
        var context = {
            config: this.pb.config,
            log: this.log,
            onRequest: function(req, res) {
                self.onHttpConnect(req, res);
            },
            onHandoffRequest: function(req, res) {
                self.onHttpConnectForHandoff(req, res);
            }
        };
        var Initializer = Configuration.active.config.server.initializer || ServerInitializer;
        var initializer = new Initializer(this.pb);
        initializer.init(context, function(err, servers) {
            if (_.isError(err)) {
                return cb(err);
            }
            self.pb.server = servers.server;
            self.pb.handOffServer = servers.handOffServer;

            cb(err, true);
        });
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
     * @param {Response} res The outgoing response
     */
    onHttpConnect (req, res){
        if (this.log.isSilly()) {
            this.log.silly('New Request: %s', (req.uid = uuid.v4()));
        }

        //bump the counter for the instance
        this.requestsServed++;

        //check to see if we should inspect the x-forwarded-proto header for SSL
        //load balancers use this for SSL termination relieving the stress of SSL
        //computation on more powerful load balancers.
        if (Configuration.active.server.ssl.use_x_forwarded && req.headers['x-forwarded-proto'] !== 'https') {
            return this.onHttpConnectForHandoff(req, res);
        }

        //route the request
        (new this.pb.Router(req, res)).handle(req, res);
    }

    /**
     * Handles traffic that comes in for HTTP when SSL is enabled.  The request is
     * redirected to the appropriately protected HTTPS url.
     * @param {Request} req The incoming request
     * @param {Response} res The outgoing response
     */
    onHttpConnectForHandoff (req, res) {
        var host = req.headers.host;
        if (host) {
            var index = host.indexOf(':');
            if (index >= 0) {
                host = host.substring(0, index);
            }
        }

        var config = Configuration.active;
        if (config.server.ssl.use_handoff_port_in_redirect) {
            host += ':' + config.sitePort;
        }

        res.writeHead(301, { Location: 'https://' + host + req.url });
        res.end();
    }

    /**
     * Initializes server registration.
     * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
     */
    initServerRegistration (cb) {
        this.pb.ServerRegistration.getInstance().init(cb);
    }

    /**
     * Initializes the command service by calling its "init" function.
     * @static
     * @method initCommandService
     * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
     */
    initCommandService (cb) {
        this.pb.CommandService.getInstance().init(cb);
    }

    /**
     * Initializes the libraries service
     * @static
     * @method initLibraries
     * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
     */
    initLibraries (cb) {
        this.pb.LibrariesService.init(cb);
    }

    /**
     * Initializes the metric registrations to measure request counts
     * @static
     * @method registerMetrics
     * @param {Function} cb
     */
    registerMetrics (cb) {
        var self = this;

        //total number of requests served
        this.pb.ServerRegistration.addItem('requests', function(callback) {
            callback(null, self.requestsServed);
        });

        //current requests
        this.pb.ServerRegistration.addItem('currentRequests', function(callback) {
            self.pb.server.getConnections(callback);
        });

        //analytics average
        this.pb.ServerRegistration.addItem('analytics', function(callback) {
            callback(null, self.pb.AnalyticsManager.getStats());
        });

        cb(null, true);
    }

    /**
     * Starts up the instance of PencilBlue
     * @method start
     */
    start () {
        var self = this;
        System.registerSignalHandlers(true);
        System.onStart(function(){
            self.init();
        });
    }

    /**
     * The default entry point to a stand-alone instance of PencilBlue
     * @static
     * @method startInstance
     * @return {PencilBlue}
     */
    static startInstance () {
        var pb = new PencilBlue();
        pb.start();
        return pb;
    }
}


//start system only when the module is called directly
if (require.main === module) {
    PencilBlue.startInstance();
}

//exports
module.exports = PencilBlue;
