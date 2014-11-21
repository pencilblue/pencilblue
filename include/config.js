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

var ASC  = 1;
var DESC = -1;

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
        //will be added to the those that already exist.  NOTE: duplicates can 
        //exist.
        indices: [

            //user
            {
                collection: 'user',
                spec: {username: ASC},
                options: {unique: true}
            },
            {
                collection: 'user',
                spec: {email: ASC},
                options: {unique: true}
            },
            {
                collection: 'user',
                spec: {username: ASC, password: ASC},
                options: {}
            },
            {
                collection: 'user',
                spec: {created: ASC},
                options: {}
            },
            {
                collection: 'user',
                spec: {admin: DESC},
                options: {}
            },
            
            //theme settings
            {
                collection: 'theme_settings',
                spec: {plugin_uid: ASC},
                options: {}
            },
            {
                collection: 'theme_settings',
                spec: {plugin_id: ASC},
                options: {}
            },
            
            //plugin settings
            {
                collection: 'plugin_settings',
                spec: {plugin_uid: ASC},
                options: {}
            },
            {
                collection: 'plugin_settings',
                spec: {plugin_id: ASC},
                options: {}
            },
            
            //settings
            {
                collection: 'settings',
                spec: {key: ASC},
                options: {unique: true}
            },
            
            //section
            {
                collection: 'section',
                spec: {parent: ASC},
                options: {}
            },
            {
                collection: 'section',
                spec: {created: ASC},
                options: {}
            },
            
            //plugin
            {
                collection: 'plugin',
                spec: {uid: ASC},
                options: {unique: true}
            },
            {
                collection: 'plugin',
                spec: {created: ASC},
                options: {}
            },
            
            //password reset
            {
                collection: 'password_reset',
                spec: {verification_code: ASC},
                options: {unique: true}
            },
            
            //media
            {
                collection: 'media',
                spec: {location: ASC},
                options: {}
            },
            {
                collection: 'media',
                spec: {name: ASC},
                options: {}//TODO make unique once validation is in place
            },
            {
                collection: 'media',
                spec: {media_type: ASC},
                options: {}//TODO make unique once validation is in place
            },
            {
                collection: 'media',
                spec: {created: ASC},
                options: {}
            },
            
            //job run
            //NOTHING YET
            
            //job log
            {
                collection: 'job_log',
                spec: {job_id: ASC},
                options: {}//TODO make unique once validation is in place
            },
            {
                collection: 'job_log',
                spec: {job_id: ASC, created: ASC},
                options: {}//TODO make unique once validation is in place
            },
            {
                collection: 'job_log',
                spec: {created: ASC},
                options: {}
            },
            
            //custom object type
            {
                collection: 'custom_object_type',
                spec: {name: ASC},
                options: {unique: true}
            },
            {
                collection: 'custom_object_type',
                spec: {created: ASC},
                options: {}
            },
            
            //custom objects
            {
                collection: 'custom_object',
                spec: {name: ASC, type: ASC},
                options: {unique: true}
            },
            {
                collection: 'custom_object',
                spec: {created: ASC},
                options: {}
            },
            
            //article
            {
                collection: 'article',
                spec: {url: ASC},
                options: {unique: true}
            },
            {
                collection: 'article',
                spec: {headline: ASC},
                options: {unique: true}
            },
            {
                collection: 'article',
                spec: {publish_date: DESC},
                options: {}
            },
            {
                collection: 'article',
                spec: {publish_date: DESC, draft: ASC},
                options: {}
            },
            {
                collection: 'article',
                spec: {author: ASC},
                options: {}
            },
            {
                collection: 'article',
                spec: {author: ASC, publish_date: DESC, draft: ASC},
                options: {}
            },
            {
                collection: 'article',
                spec: {article_media: ASC},
                options: {}
            },
            {
                collection: 'article',
                spec: {article_topics: ASC},
                options: {}
            },
            {
                collection: 'article',
                spec: {article_sections: ASC},
                options: {}
            },
            {
                collection: 'article',
                spec: {created: ASC},
                options: {}
            },
            
            //topic
            {
                collection: 'topic',
                spec: {name: ASC},
                options: {unique: true}
            },
            {
                collection: 'topic',
                spec: {created: ASC},
                options: {}
            },
            
            //page
            {
                collection: 'page',
                spec: {url: ASC},
                options: {unique: true}
            },
            {
                collection: 'page',
                spec: {headline: ASC},
                options: {unique: true}
            },
            {
                collection: 'page',
                spec: {publish_date: DESC},
                options: {}
            },
            {
                collection: 'page',
                spec: {publish_date: DESC, draft: ASC},
                options: {}
            },
            {
                collection: 'page',
                spec: {author: ASC},
                options: {}
            },
            {
                collection: 'page',
                spec: {author: ASC, publish_date: DESC, draft: ASC},
                options: {}
            },
            {
                collection: 'page',
                spec: {page_media: ASC},
                options: {}
            },
            {
                collection: 'page',
                spec: {page_topics: ASC},
                options: {}
            },
            {
                collection: 'page',
                spec: {created: ASC},
                options: {}
            }
        ]
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
    }
};

var CONFIG_FILE_NAME    = 'config.json';
var CONFIG_MODULE_NAME  = 'config.js';
var OVERRIDE_FILE_PATHS = [
    path.join(DOCUMENT_ROOT, CONFIG_FILE_NAME),
    path.join(EXTERNAL_ROOT, CONFIG_FILE_NAME),
    path.join(DOCUMENT_ROOT, CONFIG_MODULE_NAME),
    path.join(EXTERNAL_ROOT, CONFIG_MODULE_NAME),
];

/**
 * Replaces ENV entries from config objects
 */
var replaceEnvVariables = function(config) {
    for (var entry in config) {
        if (config[entry].ENV){
            config[entry] = process.env[config[entry].ENV];
        } else if (Array.isArray(config[entry]) && config[entry].length) {
            // Process Array entries.
            config[entry] = config[entry].map(function(arrEntry) {
                if (arrEntry.ENV) {
                    return process.env[arrEntry.ENV];
                }
                return arrEntry;
            });
        } else if (typeof config[entry] === 'object' && Object.keys(config[entry]).length) {
            // Process object entries recursively.
            replaceEnvVariables(config[entry]);
        }
    }
};

/**
 * Loads an external configuration.
 * NOTE: This should only be called once by the core code at startup.  Calling
 * this function after the server starts may cause unintended behavior across
 * the system.
 */
var loadConfiguration = function() {

    // If no log file exists, we should create one
    if (!fs.existsSync(LOG_FILE)) {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR);
        }
        console.log('SystemStartup: Creating log file [%s]', LOG_FILE);
        fs.writeFileSync(LOG_FILE, '');
    }

    //find the override file, if exists
    var override       = {};
    var overrideFile   = null;
    var overridesFound = false;
    for (var i = 0; i < OVERRIDE_FILE_PATHS.length; i++) {

    	overrideFile = OVERRIDE_FILE_PATHS[i];
    	if (fs.existsSync(overrideFile)) {

            try{
              override       = require(overrideFile);
              replaceEnvVariables(override);
              overridesFound = true;
              break;
            }
            catch(e){
              console.log('SystemStartup: Failed to parse configuration file [%s]: %s', overrideFile, e.stack);
            }
    	}
    	else {
    		console.log('SystemStartup: No configuration file [%s] found.', overrideFile);
    	}
    }

    //log result
    var message = overridesFound ? 'Override file ['+overrideFile+'] will be applied.' : 'No overrides are available, skipping to defaults';
    console.log('SystemStartup: %s', message);

    //perform any overrides
    config = utils.deepMerge(override, config);

    //setup logging
    if (!config.logging) {
        config.logging = {
            transports: [
                 new (winston.transports.Console)({ level: config.log_level, timestamp: true, label: cluster.worker ? cluster.worker.id : 'M'}),
                 new (winston.transports.File)({ filename: LOG_FILE, level: config.log_level, timestamp: true })
           ]
        };
    }

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
