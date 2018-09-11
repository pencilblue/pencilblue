const Promise = require('bluebird');
const Configuration = require('./include/config.js');

function createPencilblueInstance(config) {
    let pb = require('./include')(config);
    Object.keys(pb).forEach((key) => pb[key] = Promise.promisifyAll(pb[key]));
    return pb;
}


let pb;

class Pencilblue {
    constructor(config) {
        this.config = config;
        pb = createPencilblueInstance(config);

        this.pb = pb;

        this.router = new pb.Router();
    }

    async startup() {
        await pb.Localization.initAsync();

        // Start the Database connections and readers
        await this._initDBConnections();
        await this._initDBIndices();

        this.pb.ServerRegistration.getInstance().init(function() {});
        this.pb.CommandService.getInstance().init(function(err, data) {});

        // Setup Routing and Middleware
        this._initMiddleware();
        this._initCoreRoutes();

        // Load in Plugins and Sites
        await this._initPlugins();
        await this._initSites();

        this._registerMetrics();

        this._addRoutesToRouter();
        this.router.listen(8080);
    }

    /******************************
     * Database Connections
     */
    async _initDBConnections (){
        //setup database connection to core database
        let dbName = pb.config.db.name;
        let result = await pb.dbm.getDbAsync(dbName) || {};
        if (!result.databaseName) {
            throw new Error(`Failed to establish a connection to: ${dbName}`);
        }
        pb.log.info(`PencilBlue: Established connection to DB: ${result.databaseName}`);
    };
    async _initDBIndices () {
        let skipIndex = pb.config.db.skip_index_check;
        let indices = pb.config.db.indices;
        let indexIsNotArray = !pb.util.isArray(indices);
        if (skipIndex || indexIsNotArray){
            return pb.log.info('PencilBlue: Skipping ensurance of indices');
        }

        pb.log.info('PencilBlue: Ensuring indices...');
        await pb.dbm.processIndicesAsync(indices);
        pb.log.info('PencilBlue: Finished indices check...');
    };

    /******************************
     * Middleware and Routing
     */
    _initMiddleware() {
        return pb.Middleware.getAll()
            .forEach((middleware) => this.router.addMiddlewareAfterAll(middleware));
    }

    _initCoreRoutes() {
        pb.RouterLoader.registerCoreRoutes();
    }
    _addRoutesToRouter () {
        let routes = pb.RouterLoader.getRoutesForRouter();
        Object.keys(routes).forEach(plugin => {
            Object.keys(routes[plugin]).forEach(path => {
                this.router.registerRoute(routes[plugin][path]);
            })
        });
    }

    /******************************
     * Sites and Plugins
     */
    async _initSites() {
        pb.SiteService.init(); // Register job runner events
        let siteService = new pb.SiteService();
        return siteService.initSites();
    }

    async _initPlugins() {
        pb.PluginService.init(); // initialize command listeners
        let pluginService = new pb.PluginService();
        return pluginService.initPlugins(); // initialize all plugins
    }

    /**********
     * Server Metrics
     */
    _registerMetrics () {
        //total number of requests served
        pb.ServerRegistration.addItem('requests', (callback) => {
            callback(null, this.router.requestsServed);
        });

        //current requests
        pb.ServerRegistration.addItem('currentRequests', (callback) => {
            callback(null, true);// this.pb.server.getConnections(callback);
        });

        //analytics average
        pb.ServerRegistration.addItem('analytics', (callback) => {
            callback(null, pb.AnalyticsManager.getStats());
        });
    };
}

//start system only when the module is called directly
if (require.main === module) {
    new Pencilblue(Configuration.load()).startup();
}

module.exports = Pencilblue;


