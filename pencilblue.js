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
// dependencies
const async = require('async');
const npm = require('npm');
const util = require('./include/util.js');
const ServerInitializer = require('./include/http/server_initializer.js');
const Lib = require('./lib');
const HtmlEncoder = require('htmlencode');
const Configuration = require('./include/config.js');

/**
 * The main driver file for PencilBlue.  Provides the function necessary to
 * start up the master and/or child processes.  In addition, it is responsible
 * for ensuring that all system services are available by requiring the
 * "requirements.js" file.
 * @class PencilBlue
 * @constructor
 */
class PencilBlue {
  constructor(config) {
    /**
     * @property pb
     * @type {Object}
     */
    this.pb = Lib(config);

    /**
     * The number of requests served by this instance
     * @property requestsServed
     * @type {Integer}
     */
    this.requestsServed = 0;
  }

  /**
   * To be called when the configuration is loaded.  The function is responsible
   * for triggered the startup of the HTTP connection listener as well as start a
   * connection pool to the core DB.
   * @method init
   */
  init() {
    const tasks = [
      util.wrapTimedTask(this, this.initModules, 'initModules'),
      util.wrapTimedTask(this, this.initRequestHandler, 'initRequestHandler'),
      util.wrapTimedTask(this, this.initDBConnections, 'initDBConnections'),
      util.wrapTimedTask(this, this.initDBIndices, 'initDBIndices'),
      util.wrapTimedTask(this, this.initServerRegistration, 'initServerRegistration'),
      util.wrapTimedTask(this, this.initCommandService, 'initCommandService'),
      util.wrapTimedTask(this, this.initSiteMigration, 'initSiteMigration'),
      util.wrapTimedTask(this, this.initSessions, 'initSessions'),
      util.wrapTimedTask(this, this.initPlugins, 'initPlugins'),
      util.wrapTimedTask(this, this.initSites, 'initSites'),
      util.wrapTimedTask(this, this.initLibraries, 'initLibraries'),
      util.wrapTimedTask(this, this.registerMetrics, 'registerMetrics'),
      util.wrapTimedTask(this, this.initServer, 'initServer'),
    ];
    async.series(tasks, (err, results) => {
      if (util.isError(err)) {
        throw err;
      }
      this.pb.log.info('PencilBlue: Ready to run!');

      // print out stats
      if (this.pb.log.isDebug()) {
        const stats = results.reduce((obj, result) => {
          obj[result.name] = result.time;  // eslint-disable-line no-param-reassign
          obj.total += result.time;  // eslint-disable-line no-param-reassign
          return obj;
        }, { total: 0 });
        this.pb.log.debug('Startup Stats (ms):\n%s', JSON.stringify(stats, null, 2));
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
  initModules(cb) {
    npm.on('log', function (message) {
      this.pb.log.info(message);
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
  initRequestHandler(cb) {
    this.pb.RequestHandler.init();
    cb(null, true);
  }

  /**
   * Starts the session handler
   * @method initSessions
   * @param {Function} cb
   */
  initSessions(cb) {
    this.pb.session.start(cb);
  }

  /**
   * Initializes the installed plugins.
   * @static
   * @method initPlugins
   * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
   */
  initPlugins(cb) {
    // initialize command listeners
    this.pb.PluginService.init();

    // initialize the plugins
    const pluginService = new this.pb.PluginService();
    pluginService.initPlugins(cb);
  }

  /**
   * Move a single tenant solution to a multi-tenant solution.
   * @static
   * @method initSiteMigration
   * @param {Function} cb - callback function
   */
  initSiteMigration(cb) {
    this.pb.SiteService.init();
    this.pb.dbm.processMigration(cb);
  }

  /**
   * Initializes site(s).
   * @method initSites
   * @static
   * @param {Function} cb - callback function
   */
  initSites(cb) {
    const siteService = new this.pb.SiteService();
    siteService.initSites(cb);
  }

  /**
   * Attempts to initialize a connection pool to the core database
   * @static
   * @method initDBConnections
   * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
   */
  initDBConnections(cb) {
    // setup database connection to core database
    this.pb.dbm.getDb(this.pb.config.db.name, (err, result) => {
      if (util.isError(err)) {
        return cb(err, false);
      } else if (!result.databaseName) {
        return cb(new Error(`Failed to establish a connection to: ${this.pb.config.db.name}`), false);
      }

      this.pb.log.debug('PencilBlue: Established connection to DB: %s', result.databaseName);
      return cb(null, true);
    });
  }

  /**
   * Checks to see if the process should verify that the indices are valid and in
   * place.
   * @static
   * @method initDBIndices
   * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
   */
  initDBIndices(cb) {
    if (this.pb.config.db.skip_index_check || !util.isArray(this.pb.config.db.indices)) {
      this.pb.log.info('PencilBlue: Skipping ensurance of indices');
      return cb(null, true);
    }

    this.pb.log.info('PencilBlue: Ensuring indices...');
    return this.pb.dbm.processIndices(this.pb.config.db.indices, (err /* , results*/) => {
      cb(err, !util.isError(err));
    });
  }

  /**
   * Initializes the HTTP server(s).  When SSL is enabled two servers are created.
   * One to handle incoming HTTP traffic and one to handle HTTPS traffic.
   * @static
   * @method initServer
   * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
   */
  initServer(cb) {
    // register default middleware
    this.pb.Middleware.getAll().forEach((middleware) => {
      this.pb.Router.addMiddlewareAfterAll(middleware);
    });

    // build server setup
    const context = {
      config: this.pb.config,
      log: this.pb.log,
      onRequest: (req, res) => {
        this.onHttpConnect(req, res);
      },
      onHandoffRequest: (req, res) => {
        this.onHttpConnectForHandoff(req, res);
      },
    };
    const Initializer = this.pb.config.server.initializer || ServerInitializer;
    const initializer = new Initializer(this.pb);
    initializer.init(context, (err, servers) => {
      if (util.isError(err)) {
        return cb(err);
      }
      this.pb.server = servers.server;
      this.pb.handOffServer = servers.handOffServer;

      return cb(err, true);
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
  onHttpConnect(req, res) {
    if (this.pb.log.isSilly()) {
      this.pb.log.silly('New Request: %s', (req.uid = util.uniqueId()));   // eslint-disable-line no-param-reassign
    }

    // bump the counter for the instance
    this.requestsServed += 1;

    // check to see if we should inspect the x-forwarded-proto header for SSL
    // load balancers use this for SSL termination relieving the stress of SSL
    // computation on more powerful load balancers.
    if (this.pb.config.server.ssl.use_x_forwarded && req.headers['x-forwarded-proto'] !== 'https') {
      return this.onHttpConnectForHandoff(req, res);
    }

    // route the request
    return (new this.pb.Router(req, res)).handle(req, res);
  }

  /**
   * Handles traffic that comes in for HTTP when SSL is enabled.  The request is
   * redirected to the appropriately protected HTTPS url.
   * @static
   * @method onHttpConnectForHandoff
   * @param {Request} req The incoming request
   * @param {Response} res The outgoing response
   */
  onHttpConnectForHandoff(req, res) {
    let host = req.headers.host;
    if (host) {
      const index = host.indexOf(':');
      if (index >= 0) {
        host = host.substring(0, index);
      }
    }
    if (this.pb.config.server.ssl.use_handoff_port_in_redirect) {
      host += `:${this.pb.config.sitePort}`;
    }

    res.writeHead(301, { Location: `https://${host}${req.url}` });
    res.end();
  }

  /**
   * Initializes server registration.
   * @static
   * @method initServerRegistration
   * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
   */
  initServerRegistration(cb) {
    this.pb.ServerRegistration.getInstance().init(cb);
  }

  /**
   * Initializes the command service by calling its "init" function.
   * @static
   * @method initCommandService
   * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
   */
  initCommandService(cb) {
    this.pb.CommandService.getInstance().init(cb);
  }

  /**
   * Initializes the libraries service
   * @static
   * @method initLibraries
   * @param {Function} cb A callback that provides two parameters: cb(Error, [RESULT])
   */
  initLibraries(cb) {
    this.pb.LibrariesService.init(cb);
  }

  /**
   * Initializes the metric registrations to measure request counts
   * @static
   * @method registerMetrics
   * @param {Function} cb
   */
  registerMetrics(cb) {
    // total number of requests served
    this.pb.ServerRegistration.addItem('requests', (callback) => {
      callback(null, this.requestsServed);
    });

    // current requests
    this.pb.ServerRegistration.addItem('currentRequests', (callback) => {
      this.pb.server.getConnections(callback);
    });

    // analytics average
    this.pb.ServerRegistration.addItem('analytics', (callback) => {
      callback(null, this.pb.AnalyticsManager.getStats());
    });

    cb(null, true);
  }

  /**
   * Starts up the instance of PencilBlue
   * @method start
   */
  start() {
    this.pb.system.registerSignalHandlers(true);
    this.pb.system.onStart(() => {
      this.init();
    });
  }

  /**
   * The default entry point to a stand-alone instance of PencilBlue
   * @static
   * @method startInstance
   * @return {PencilBlue}
   */
  static startInstance() {
    const config = Configuration.load();
    const pb = new PencilBlue(config);
    pb.start();
    return pb;
  }
}

// start system only when the module is called directly
if (require.main === module) {
  PencilBlue.startInstance();
}

// exports
module.exports = PencilBlue;
