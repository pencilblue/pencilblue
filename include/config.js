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
	siteName: 'pencilblue',
	siteRoot: 'http://localhost:8080',
	siteIP:   '127.0.0.1',
	sitePort: 8080,
	docRoot:  DOCUMENT_ROOT,
	db: {
        type:'mongo',
		servers: [
          'mongodb://127.0.0.1:27017/'
        ],
        name: 'pencil_blue',
        writeConern: 1
	},
	cache: {
		fake: true,
		host: "localhost",
		port: 6379
	},
	session: {
		storage: "redis",
		timeout: 600000
	},
	log_level: LOG_LEVEL,
	locales: {
		supported: [
            {
            	locale: 'en_us',
            	file: path.join(DOCUMENT_ROOT, 'public', 'localization', 'en-us.js')
        	}
        ]
	},
	settings: {
		use_memory: true,
		use_cache: true
	},
	templates: {
		use_memory: true,
		use_cache: true
	},
	plugins: {
		caching: {
			use_memory: true,
			use_cache: true,
		}
	},
	registry: {
		enabled: true,
		update_interval: 30000,
		key: 'server_registry'
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
    for(var key in override) {
	    console.log("SystemStartup: Overriding property KEY="+key+" VAL="+JSON.stringify(override[key])+'');
	    config[key] = override[key];
    }
    
    //setup logging
    config.logging = {
		transports: [
             new (winston.transports.Console)({ level: config.log_level, timestamp: true }),
             new (winston.transports.File)({ filename: LOG_FILE, level: config.log_level, timestamp: true })
       ]
	};
	return config;
};

//export configuration
config                   = loadConfiguration();
config.loadConfiguration = loadConfiguration;
module.exports           = config;
