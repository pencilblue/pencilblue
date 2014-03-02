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

global.LOG_LEVEL = 'debug';
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
		storage: "redis",//"mongo"
		timeout: 600000
	},
	logging: {
		level: LOG_LEVEL,
		transports: [
             new (winston.transports.Console)({ level: LOG_LEVEL, timestamp: true }),
             new (winston.transports.File)({ filename: LOG_FILE, level: LOG_LEVEL, timestamp: true })
       ]
	},
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
	// TODO decide if this is still needed or if the file logger creates the file for us
	console.log("Creating log directory: "+LOG_DIR);
    if (!fs.existsSync(LOG_FILE)) {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR);
        }
        fs.writeFileSync(LOG_FILE, '');
    }
   
    var overrideFile = path.join(EXTERNAL_ROOT, 'config.json');
    if (fs.existsSync(overrideFile)) {
	    var result = fs.readFileSync(overrideFile, {encoding: "UTF-8"});
		      
	    var override = {};
	    if (typeof result === 'Error') {
	        console.log('Failed to read external configuration file. Using defaults: '+err);
	        return config;
	    }
	    else{
		    try{
		      override = JSON.parse(result);
		    }
		    catch(e){
		      console.log('Failed to parse configuration file ['+overrideFile+'].  Using defaults: '+e);
		      return config;
		    }
	    }
	
	    for(var key in override) {
		    console.log("Overriding property: KEY="+key+" VAL="+JSON.stringify(override[key]));
		    config[key] = override[key];
	    }
    }
    else{
    	console.log("No override file found ["+overrideFile+"], keeping defaults");
    }
	return config;
};

//export configuration
config                   = loadConfiguration();
config.loadConfiguration = loadConfiguration;
module.exports           = config;
