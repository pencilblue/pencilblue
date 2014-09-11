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

//dependencies
var cluster = require('cluster');
var process = require('process');
var utils   = require('./util.js');

/**
 * Default configuration.  The settings here should be overriden by taking the
 * example file "sample.config.json" and modifying it to override the properties
 * shown below.  In order to properly override the default configuration do the
 * following:
 * 1) copy "sample.config.json" to "/etc/pencilblue/config.json"
 * 2) Override the properties as desired.
 * 3) Add any custom properties you wish to provide for your specific purposes.
 */

// Don't change this setting
global.DOCUMENT_ROOT = __dirname.substr(0, __dirname.indexOf(path.sep+'include'));
global.EXTERNAL_ROOT = path.join(path.sep, 'etc', 'pencilblue');

global.LOG_LEVEL = 'info';
global.LOG_DIR   = path.join(DOCUMENT_ROOT, 'log');
global.LOG_FILE  = path.join(LOG_DIR, 'pencilblue.log');

var config = {

    //The name of the site.
	siteName: 'pencilblue',

    //The root of the site.  This host part should ALWAYS match the value of
    //the siteIP
	siteRoot: 'http://localhost:8080',

    //The hostname or IP address represented by the entire site.  Should match
    //your domain name if in production use.
	siteIP:   'localhost',

    //The primary port to listen for traffic on.  Some environment such as
    //heroku force you to use whatever port they have available.  In such cases
    //the port is passed as an environment variable.
	sitePort: process.env.port || process.env.PORT || 8080,

    //the absolute file path to the directory where installation lives
	docRoot:  DOCUMENT_ROOT,

    //provides a configuration for connecting to persistent storage.  The
    //default configuration is meant for mongodb.
	db: {
        type:'mongo',
		servers: [
          'mongodb://127.0.0.1:27017/'
        ],

        //the name of the default DB for the system
        name: 'pencil_blue',

        //http://docs.mongodb.org/manual/core/write-concern/
        writeConcern: 1,

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
        }
	},

    //PB supports redis as a caching layer out of the box.  For development
    //purposes the "fake-redis" module can be used by setting the fake property
    //to true.
	cache: {
		fake: true,
		host: "localhost",
		port: 6379,
        //auth_pass: "password here"
	},

    //PB supports two session stores out of the box: mongo & redis.  The
    //timeout value is in ms.
	session: {
		storage: "redis",
		timeout: 600000
	},

    //The global log level: silly, debug, info, warn, error
	log_level: LOG_LEVEL,

    //The list of supported locales along with the location of the localization
    //keys.
	locales: {
		supported: [
            {
            	locale: 'en_us',
            	file: path.join(DOCUMENT_ROOT, 'public', 'localization', 'en-us.js')
        	}
        ]
	},

    //System settings always have the persistent storage layer on.  Optionally,
    //the cache and/or memory can be used.  It is not recommended to use memory
    //unless you are developing locally with a single worker.  Memory is not
    //synced across cluster workers so be careful if this option is set to true.
	settings: {
		use_memory: true,
		use_cache: false
	},

    //The template engine can take advantage of caching so that they are not
    //retrieved and compiled from disk on each request.  In a development
    //environment it is ok because you will want to see the changes you make
    //after each tweak.
	templates: {
		use_memory: true,
		use_cache: false
	},

    //Plugins can also take advantage of the caching.  This prevents a DB call
    //to lookup active plugins and their settings.
	plugins: {
		caching: {
			use_memory: true,
			use_cache: false,
		}
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
        workers: 1
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
            use_x_forwarded: false,
            use_handoff_port_in_redirect: false,
            key: "ssl/key.pem",
            cert: "ssl/cert.crt",
            chain: "ssl/chain.crt"
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
        broker: 'redis'
    },
    
    //The media block specifies the options for how media is persisted.  
    media: {
        
        provider: 'fs',
        parent_dir: 'public',
    }
};

var CONFIG_FILE_NAME    = 'config.json';
var OVERRIDE_FILE_PATHS = [
    path.join(DOCUMENT_ROOT, CONFIG_FILE_NAME),
    path.join(EXTERNAL_ROOT, CONFIG_FILE_NAME),
];

/**
 * Loads an external configuration.
 * NOTE: This should only be called once by the core code at startup.  Calling
 * this function after the server starts may cause unintended behavior across
 * the system.
 */
var loadConfiguration = function() {

    // If no log file exists, we should create one
	// TODO decide if this is still needed or if the file logger creates the file for us
    if (!fs.existsSync(LOG_FILE)) {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR);
        }
        console.log("SystemStartup: Creating log file ["+LOG_FILE+']');
        fs.writeFileSync(LOG_FILE, '');
    }

    var override       = {};
    var overrideFile   = null;
    var overridesFound = false;
    for (var i = 0; i < OVERRIDE_FILE_PATHS.length; i++) {

    	overrideFile = OVERRIDE_FILE_PATHS[i];
    	if (fs.existsSync(overrideFile)) {

    		var result = fs.readFileSync(overrideFile, {encoding: "UTF-8"});
    	    if (typeof result === 'Error') {
    	        console.log('SystemStartup: Failed to read external configuration file ['+overrideFile+'].');
    	    }
    	    else{
    		    try{
    		      override       = JSON.parse(result);
    		      overridesFound = true;
    		      break;
    		    }
    		    catch(e){
    		      console.log('SystemStartup: Failed to parse configuration file ['+overrideFile+']: '+e.message);
    		    }
    	    }
    	}
    	else {
    		console.log('SystemStartup: No configuration file ['+overrideFile+'] found.');
    	}
    }

    //log result
    var message = overridesFound ? 'Override file ['+overrideFile+'] will be applied.' : 'No overrides are available, skipping to defaults';
    console.log('SystemStartup: '+message);

    //perform any overrides
    config = utils.deepMerge(override, config);

    //setup logging
    config.logging = {
		transports: [
             new (winston.transports.Console)({ level: config.log_level, timestamp: true, label: cluster.worker ? cluster.worker.id : 'M'}),
             new (winston.transports.File)({ filename: LOG_FILE, level: config.log_level, timestamp: true })
       ]
	};

    //special check to ensure that there is no ending slash on the site root
    if (config.siteRoot.lastIndexOf('/') === (config.siteRoot.length - 1)) {
        config.siteRoot = config.siteRoot.substring(0, config.siteRoot.length - 1);
    }
	return config;
};

//export configuration
config                   = loadConfiguration();
config.loadConfiguration = loadConfiguration;
module.exports           = config;
