/*
    Copyright (C) 2016  PencilBlue, LLC

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
var fs      = require('fs');
var path    = require('path');
var cluster = require('cluster');
var util    = require('./util.js');
var winston = require('winston');

/**
 * Default configuration.  The settings here should be overriden by taking the
 * example file "sample.config.json" and modifying it to override the properties
 * shown below.  In order to properly override the default configuration do the
 * following:
 * 1) copy "sample.config.json" to "/etc/pencilblue/config.json"
 * 2) Override the properties as desired.
 * 3) Add any custom properties you wish to provide for your specific purposes.
 * @class Configuration
 * @constructor
 */
function Configuration(){}

/**
 *
 * @static
 * @readonly
 * @property DOCUMENT_ROOT
 * @type {String}
 */
Configuration.DOCUMENT_ROOT = __dirname.substr(0, __dirname.indexOf(path.sep+'include'));

/**
 *
 * @static
 * @readonly
 * @property EXTERNAL_ROOT
 * @type {String}
 */
Configuration.EXTERNAL_ROOT = path.join(path.sep, 'etc', 'pencilblue');


/**
 * The default logging directory absolute file path
 * @private
 * @static
 * @readonly
 * @property LOG_DIR
 * @type {String}
 */
var LOG_DIR = path.join(Configuration.DOCUMENT_ROOT, 'log');

/**
 * The default logging file absolute path
 * @private
 * @static
 * @readonly
 * @property LOG_FILESC
 * @type {String}
 */
var LOG_FILE = path.join(LOG_DIR, 'pencilblue.log');

/**
 * The configuration module overrides file name
 * @private
 * @static
 * @readonly
 * @property CONFIG_MODULE_NAME
 * @type {String}
 */
var CONFIG_MODULE_NAME  = 'config.js';

/**
 * The default list of absolute file paths to try when loading the configuration
 * @private
 * @static
 * @readonly
 * @property OVERRIDE_FILE_PATHS
 * @type {Array}
 */
var OVERRIDE_FILE_PATHS = [
    path.join(Configuration.DOCUMENT_ROOT, CONFIG_MODULE_NAME),
    path.join(Configuration.EXTERNAL_ROOT, CONFIG_MODULE_NAME)
];

/**
 * Retrieve the base configuration
 */
Configuration.getBaseConfig = function(multisite) {
    return {

        //The name of the site.
        siteName: 'pencilblue',

        //The root of the site.  This host part should ALWAYS match the value of
        //the siteIP
        siteRoot: 'http://localhost:8080',

        //The hostname or IP address that the web server instance will bind to
        siteIP:   '0.0.0.0',

        //The primary port to listen for traffic on.  Some environment such as
        //heroku force you to use whatever port they have available.  In such cases
        //the port is passed as an environment variable.
        sitePort: process.env.port || process.env.PORT || 8080,

        //the absolute file path to the directory where installation lives
        docRoot:  Configuration.DOCUMENT_ROOT,

        //enables/disables multiple sites in a single pencilblue instance (multitenancy)
        multisite: {
            enabled: false,

            // When multisite.enabled is true, this is the hostname that will resolve to the global namespace.
            // Only Admin routes will be activated for this hostname.
            globalRoot: 'http://global.localhost:8080'
        },

        //provides a configuration for connecting to persistent storage.  The
        //default configuration is meant for mongodb.
        db: {
            type:'mongo',
            servers: [
                '127.0.0.1:27017'
            ],

            //the name of the default DB for the system
            name: 'pencil_blue',

            options: {

                //http://docs.mongodb.org/manual/core/write-concern/
                w: 1
            },

            //PB provides the ability to log queries.  This is handy during
            //development to see how many trips to the DB a single request is
            //making.  The queries log at level "info".
            query_logging: false,

            //http://mongodb.github.io/node-mongodb-native/api-generated/db.html#authenticate
            authentication: {
                un: null,
                pw: null,
                options: {
                    //authMechanism: "MONGODB-CR"|"GSSAPI"|"PLAIN", //Defaults to MONGODB-CR
                    //authdb: "db name here", //Defaults to the db attempted to be connected to
                    //authSource: "db name here", //Defaults to value of authdb
                }
            },

            //This option instructs the child to skip the checks to ensure that the
            //indices are built.  It makes the assumption that the user doesn't care
            //or that they are already in place.  This would typically be used in a
            //large production system where load can burst.  In that particular case
            //you wouldn't want to let your instances annoy the DB to check for
            //indices because it would cause greater strain on the DB under heavy
            //load.
            skip_index_check: false,

            //The indices that will be ensured by the system.  This list is checked
            //at startup by every child process.  The override config.json file may
            //also provide this attribute.  In that case the items in that array
            //will be added to the those that already exist.  This attributes is generated
            //based on the multisite boolean setting.  NOTE: duplicates can
            //exist.
            indices: require('./dao/indices.js')(multisite)
        },

        //PB supports redis as a caching layer out of the box.  For development
        //purposes the "fake-redis" module can be used by setting the fake property
        //to true.
        cache: {
            fake: true,
            host: "localhost",
            port: 6379
            //auth_pass: "password here"
        },

        //PB supports two session stores out of the box: mongo & redis.  The
        //timeout value is in ms.
        session: {
            storage: "redis",
            timeout: 2000000
        },

        //The logging settings.  The level property specifies at what level to log.
        //It can be of any of the following: silly, debug, info, warn, error.  The
        //file property specifes the absolute file path where the log file should
        //be written.  If no value is provided the file transport will not be
        //configured. The "showErrors" property indicates if the stack trace should
        //be included in the serialization of the error.
        logging: {

            level: "info",
            file: LOG_FILE,
            showErrors: true
        },

        //System settings always have the persistent storage layer on.  Optionally,
        //the cache and/or memory can be used.  It is not recommended to use memory
        //unless you are developing locally with a single worker.  Memory is not
        //synced across cluster workers so be careful if this option is set to true.
        settings: {
            use_memory: true,
            use_cache: false,

            //The timeout specifies how long in milliseconds a setting will exist
            //in memory before being flushed.  A value of 0 indicates that the
            //values will not be purged from memory once expired.
            memory_timeout: 0
        },

        //The template engine can take advantage of caching so that they are not
        //retrieved and compiled from disk on each request.  In a development
        //environment it is ok because you will want to see the changes you make
        //after each tweak.
        templates: {
            use_memory: true,
            use_cache: false,

            // syncSettingsAtStartup will automatically keep all plugins
            // per site up to date with its details.json counterpart.
            // Existing plugin settings will not be affected. New
            // settings will be added, removed settings will be deleted.
            // NOTE: This can affect your spin up time slightly. This
            // delay will scale with your number of sites and plugins.
            syncSettingsAtStartup: false,

            //The timeout specifies how long in milliseconds a setting will exist
            //in memory before being flushed.  A value of 0 indicates that the
            //values will not be purged from memory once expired.
            memory_timeout: 0
        },

        //Plugins can also take advantage of the caching.  This prevents a DB call
        //to lookup active plugins and their settings.
        plugins: {
            caching: {
                use_memory: true,
                use_cache: false,

                //The timeout specifies how long in milliseconds a setting will exist
                //in memory before being flushed.  A value of 0 indicates that the
                //values will not be purged from memory once expired.
                memory_timeout: 0
            },

            //The default plugin.  Allows for the default plugin to be
            //referenced from a single location.  The property can be overriden
            //but may have unexpected behavior.
            default: 'pencilblue'
        },

        //PB provides a process registry.  It utilizes the cache to register
        //properties about itself that are available via API or in the admin
        //console.  This makes it easy to assist in monitoring your cluster and
        //processes in production or development.  The type value can be one of
        //three values: 'redis', 'mongo' or an absolute path that implements the
        //functions necessary to be a registration storage provider.The update
        //interval specifies how many ms to wait before updating the registry with
        //fresh data about itself.  The key specifies what the base of the cache
        //key looks like.
        registry: {
            enabled: true,
            logging_enabled: false,
            type: "redis",
            update_interval: 10000,
            key: 'server_registry'
        },

        //PB aims to help developers scale.  The system can take advantage of
        //Node's cluster module to scale across the system cores. In order to
        //protect against repeated catastrophic failures the system allows for
        //"fatal_error_count" errors to occur outside of "fatal_error_timeout" secs.
        //If the maximum number of failures occur inside of the allowed timeframe
        //the master process and all the worker children will shutdown.
        cluster: {
            fatal_error_timeout: 2000,
            fatal_error_count: 5,

            //This value descibes the number of child processes to spawn when the
            //master process is started in self managed mode.  The value can also
            //be set to "auto".  This will instruct the master process to inspect
            //the number of cores on the server and spawn a child process for each
            //core.
            workers: 1,

            //The self managed flag indicates whether or not PencilBlue should
            //start a master process who's sole responsibility is to watch over the
            //child workers that it spawns.  The default, TRUE, allows for
            //PencilBlue to watch for failures and decide on its own whether or not
            //to attempt to continue.  When FALSE, PB starts as a stand alone
            //process.  Set to FALSE when you want to debug a single process or
            //when operating in a cloud environment that manages the instances on
            //each server.
            self_managed: true
        },

        //PB supports two methods of handling SSL.  Standard point to a cert as
        //described by the options below and SSL termination and the use of the
        //"X-FORWARDED-PROTO" header.  Node does not gracefully handle the redirect
        //of HTTP traffic to HTTPS.  PB handles this for you in what we call the
        //handoff.  PB will start a second http server listening on the
        //"handoff_port".  When traffic is received it will be redirected to the
        //URL of the form "siteRoot+[URL PATH]".  The port will only show if
        //specified by the "use_handoff_port_in_redirect" property.
        server: {
            ssl: {
                enabled: false,
                handoff_port: 8080,
                handoff_ip: '0.0.0.0',
                use_x_forwarded: false,
                use_handoff_port_in_redirect: false,
                key: "ssl/key.pem",
                cert: "ssl/cert.crt",

                //The certificate authority, or chain, is optional.  It is
                //recommended to keep the paths consistent and place the CA cert
                //at: "ssl/chain.crt"
                chain: null
            },

            //when non-empty, a header (X-POWERED-BY) will be added to each outgoing
            //response with "PencilBlue".  Cheesy but it helps the BuiltWith tools
            //of the world kep track of who uses what
            x_powered_by: "PencilBlue"
        },

        //PB uses a publish subscribe model to announce events to other members of
        //the cluster.  Out of the box PB provides a Redis implementation but it is
        //also possible to provide a custom implementation. AMQP would be a good
        //future implementation just as an example.  Custom implementations can be
        //used by providing the absolute path to the implementation in the "broker"
        //field.
        command: {
            broker: 'redis',
            timeout: 3000
        },

        //The media block specifies the options for how media is persisted.
        //PencilBlue provides two storage engines out of the box.  The first is
        //'fs' which is the regular file system.  This is the default option.
        //However, as soon as PB is clustered on two or more nodes this **MUST** be
        //changed to a different provider.  The second provider, 'mongo', is a media
        //storage mechanism powered by MongoDB's GridFS.  The 'mongo' provider does
        //support the distributed PencilBlue configuration although it is not
        //recommended for large scale use.  Systems that have larger or more
        //performant data needs should look at other plugins to support that need.
        media: {

            provider: 'fs',
            parent_dir: 'public',

            //The root media URL.  Example values: '//cdn.mydomain.com' or
            //'http://example-bucket.s3-website-us-east-1.amazonaws.com'.  Use this
            //if media is served from a domain other than the site root.
            urlRoot: '',

            //The maximum size of media files that can be uploaded to the server in
            //bytes
            max_upload_size: 2 * 1024 * 1024
        },

        //Contains all of the configuration for localization and internationalization.
        localization: {

            //The default locale is the fallback when localization fails for the user's desired language.
            defaultLocale: 'en-US'
        },

        //The locking service provides a common mechanism for processes to reserve
        //access to resources during critical operations.  When the locks exist,
        //other PB instances will not hinder the other process from completing its
        //task.
        locks: {

            //By default, the db will be used as the store for the locks.  Another
            //out of the box provider is 'cache'.  It leverages the cache as a
            //store.  Custom implementations are also acceptable.  The relative
            //path from the installation root to the module should be provided.
            provider: 'db',

            //The default amount of time that a lock will be persisted in seconds.
            timeout: 30
        },

        //Configures the AnalyticsManager
        analytics: {

            //the amount of time that the analytics manager will wait, in
            //milliseconds, for a provider to complete its rendering before
            //moving on
            timeout: 50
        },

        //Pulls in the package.json file for PB and extracts the version so it is
        //available in the configuration.
        version: require(path.join(Configuration.DOCUMENT_ROOT, 'package.json')).version
    };
};

/**
 * Loads an external configuration.
 * NOTE: This should only be called once by the core code at startup.  Calling
 * this function after the server starts may cause unintended behavior across
 * the system.
 * @static
 * @method load
 * @param {Array|String} [filePaths]
 * @return {Object}
 */
Configuration.load = function(filePaths) {
    if (util.isString(filePaths)) {
        filePaths = [filePaths];
    }
    else if (!filePaths) {
        filePaths = OVERRIDE_FILE_PATHS;
    }

    //find the override file, if exists
    var override       = {};
    var overrideFile   = null;
    var overridesFound = false;
    for (var i = 0; i < filePaths.length; i++) {

    	overrideFile = filePaths[i];
    	if (fs.existsSync(overrideFile)) {

            try{
                override       = require(overrideFile);
                overridesFound = true;
                break;
            }
            catch(e){
                console.log('SystemStartup: Failed to parse configuration file [%s]: %s', overrideFile, e.stack);
            }
    	}
    }

    //log result
    var message;
    if (overridesFound) {
        message = util.format('Override file [%s] will be applied.', overrideFile);
    }
    else {
        message = 'No overrides are available, skipping to defaults after searching the following files:';
        filePaths.forEach(function(filePath) {
            message += util.format('\n* %s', filePath);
        });
    }
    console.log(message);

    //perform any overrides
    return Configuration.mergeWithBase(override);
};

/**
 *
 * @static
 * @method mergeWithBase
 */
Configuration.mergeWithBase = function(overrides) {

    var multisite = overrides && overrides.multisite ? overrides.multisite.enabled : false;
    var baseConfig = Configuration.getBaseConfig(multisite);

    //merge in all overrides with the base configuration
    var config = util.deepMerge(overrides, baseConfig);

    //special check to ensure that there is no ending slash on the site root
    if (config.siteRoot.lastIndexOf('/') === (config.siteRoot.length - 1)) {
        config.siteRoot = config.siteRoot.substring(0, config.siteRoot.length - 1);
    }

    //special check to ensure that there is no ending slash on the media root
    if (config.media.urlRoot.lastIndexOf('/') === (config.media.urlRoot.length - 1)) {
        config.media.urlRoot = config.media.urlRoot.substring(0, config.media.urlRoot.length - 1);
    }

	return config;
};

//export configuration
module.exports = Configuration;
