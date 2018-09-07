console.time("startup");
if(process.env.NEW_RELIC_LICENSE_KEY && process.env.NEW_RELIC_APP_NAME){
    require('newrelic');
}
'use strict';

//dependencies
const Promise = require('bluebird');
const util = require('./include/util.js');
const ServerInitializer = Promise.promisifyAll(require('./include/http/server_initializer.js'));

/**
 * The main driver file for PencilBlue.  Provides the function necessary to
 * start up the master and/or child processes.  In addition, it is responsible
 * for ensuring that all system services are available by requiring the
 * "requirements.js" file.
 * @class PencilBlue
 * @constructor
 */
class PencilBlue {
    constructor (config) {
        this.config = config;
    }

    get requirements () {
        return this.pb;
    }
    get pb () {
        if(this._pb){
            return this._pb;
        }
        this._pb = require('./include')(this.config);
        Object.keys(this._pb).forEach((key) => this._pb[key] = Promise.promisifyAll(this._pb[key]));
        return this._pb;
    }
    get requestsServed () {
        return this._requestServed;
    }
    set requestsServed (value) {
        this._requestServed = value;
    }

    static startInstance () {
        let Configuration = require('./include/config.js');
        let config        = Configuration.load();
        let pb            = new PencilBlue(config);
        pb.start();
        return pb;
    }

    async start () {
        this.pb.system.registerSignalHandlers(true);
        this.pb.system = Promise.promisifyAll(this.pb.system);
        this.pb.system.onStartAsync();
        return this.runInitTasks();
    };
    /**
     * To be called when the configuration is loaded.  The function is responsible
     * for triggered the startup of the HTTP connection listener as well as start a
     * connection pool to the core DB.
     * @method init
     */
    async runInitTasks () {
        await this._initLocalizationServices();
        this._initRoutes(); // Replaced

        // Setup Database
        await this._initDBConnections();
        await this._initDBIndices();

        // Init clustering services -- Replace with Koa Cluster? eventually
        await this._initServerRegistration();
        await this._initCommandService();

        // await this._initSiteMigration();

        await this.pb.session.startAsync(); // init session
        await this._initMiddleware();
        await this._initPlugins();

        await this._initSites();
        this._initLocales(); // Command Service Tasks

        this._registerMetrics();
        await this.initServer();

        this.pb.log.info('PencilBlue: Ready to run!');
        console.timeEnd("startup");
        this._printStartupLog([]);
    }
    _printStartupLog(results) {
        let stats = results.reduce((obj, result) => {
            obj[result.name] = result.time;
            obj.total += result.time;
            return obj;
        }, {total: 0});

        this.pb.log.debug('Startup Stats (ms):\n%s', JSON.stringify(stats, null, 2));
    }

    async _initLocalizationServices () {
        return this.pb.Localization.initAsync();
    }
    _initRoutes () {
        this.pb.RequestHandler.init(); // TODO: Registers system routes, replace with KOA
    }
    _initMiddleware () {
        let middleware = this.pb.Middleware.getAll(); // TODO: Replace with KOA
        middleware
            .forEach((middleware) => this.pb.Router.addMiddleware(middleware));
    }
    async _initPlugins () {
        this.pb.PluginService.init(); // initialize command listeners
        let pluginService = new this.pb.PluginService();
        return pluginService.initPluginsAsync(); // initialize all plugins
    }
    async _initSiteMigration () {
        return this.pb.dbm.processMigrationAsync();
    } // Shut this off, we might delete it as we dont need it
    async _initSites() {
        this.pb.SiteService.init();
        let siteService = new this.pb.SiteService();
        return siteService.initSitesAsync();
    }
    _initLocales () {
        this.pb.LocalizationService.init();
    }

    async _initDBConnections (){
        //setup database connection to core database
        let dbName = this.pb.config.db.name;
        let result = await this.pb.dbm.getDbAsync(dbName) || {};
        if (!result.databaseName) {
            throw new Error(`Failed to establish a connection to: ${dbName}`);
        }
        this.pb.log.debug(`PencilBlue: Established connection to DB: ${result.databaseName}`);
    };
    async _initDBIndices () {
        let skipIndex = this.pb.config.db.skip_index_check;
        let indices = this.pb.config.db.indices;
        let indexIsNotArray = !util.isArray(indices);
        if (skipIndex || indexIsNotArray){
            return this.pb.log.info('PencilBlue: Skipping ensurance of indices');
        }

        this.pb.log.info('PencilBlue: Ensuring indices...');
        return this.pb.dbm.processIndicesAsync(indices);
    };


    // TODO: replace with KOA?
    async initServer () {
        let context = {
            config: this.pb.config,
            log: this.pb.log,
            onRequest: (req, res) => {
                this._onHttpConnect(req, res);
            },
            onHandoffRequest: (req, res) => {
                this._onHttpConnectForHandoff(req, res);
            }
        };
        let Initializer = this.pb.config.server.initializer || ServerInitializer;
        let initializer = Promise.promisifyAll(new Initializer(this.pb));
        let servers = await initializer.initAsync(context); // TODO: Replace with app.listen

        this.pb.Router.listen(this.pb.config.sitePort);

        this.pb.server = this.pb.Router;
        this.pb.handOffServer = this.pb.Router.handOffServer;
    };

    _onHttpConnect (req, res){
        function isIpAddress(ipAddress) {
            return /(\d+\.\d+\.\d+\.\d+)|:(\d+)/.test(ipAddress);
        }
        this.requestsServed++;

        // TODO: move to middleware?  KOA?
        //check to see if we should inspect the x-forwarded-proto header for SSL
        //load balancers use this for SSL termination relieving the stress of SSL
        //computation on more powerful load balancers.
        if (this.pb.config.server.ssl.use_x_forwarded &&
            req.headers['x-forwarded-proto'] !== 'https' &&
            !isIpAddress(req.headers.host)) {
            return this._onHttpConnectForHandoff(req, res);
        }

        this.pb.Router.listen(this.pb.config.sitePort);
    };
    // Replace with KOA/Middleware?
    _onHttpConnectForHandoff (req, res) {
        let host = req.headers.host;
        if (host) {
            var index = host.indexOf(':');
            if (index >= 0) {
                host = host.substring(0, index);
            }
        }
        if (this.pb.config.server.ssl.use_handoff_port_in_redirect) {
            host += ':'+ this.pb.config.sitePort;
        }

        res.writeHead(301, { "Location": `https://${host}${req.url}`});
        res.end();
    };

    /***
     * Clustering Actions
     * @private
     */
    _initCommandService () {
         this.pb.CommandService.getInstance().init(function(err, data) {});
    };

    _initServerRegistration () {
        this.pb.ServerRegistration.getInstance().init(function() {});
    };
    _registerMetrics () {
        //total number of requests served
        this.pb.ServerRegistration.addItem('requests', (callback) => {
            callback(null, this.requestsServed);
        });

        //current requests
        this.pb.ServerRegistration.addItem('currentRequests', (callback) => {
           callback(null, true);// this.pb.server.getConnections(callback);
        });

        //analytics average
        this.pb.ServerRegistration.addItem('analytics', (callback) => {
            callback(null, this.pb.AnalyticsManager.getStats());
        });
    };
}

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
