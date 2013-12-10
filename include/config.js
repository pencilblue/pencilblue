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

global.LOG_LEVEL = 'debug';
global.LOG_FILE  = '/etc/pencilblue/log/pencilblue.log';

var config = {
	siteName: 'pencilblue',
	siteRoot: 'http://localhost:8080',
	siteIP:   '127.0.0.1',
	sitePort: 8080,
	docRoot:  DOCUMENT_ROOT,
	db: {
        type:'mongo',
		servers: [
          'mongodb://192.168.1.73:27017/'
        ],
        name: 'pencil_blue',
        writeConern: 1
	},
	logging: {
		transports: [
             new (winston.transports.Console)({ level: "debug", timestamp: true }),
             new (winston.transports.File)({ filename: '/etc/pencilblue/log/pencilblue.log', level: "debug", timestamp: true })
       ]
	}
};
    
/**
 * Loads an external configuration.  
 * NOTE: This should only be called once by the core code at startup.  Calling 
 * this function after the server starts may cause unintended behavior across 
 * the system.
 */
global.loadConfiguration = function() {
	var result = fs.readFileSync('/etc/pencilblue/config.json', {encoding: "UTF-8"});
		  
	var override = null;
	if (typeof result === 'Error') {
	    console.log('Failed to read external configuration file. Using defaults: '+err);
	    return config;
	}
	else{
		try{
		  override = JSON.parse(result);
		}
		catch(e){
		  console.log('Failed to parse configuration file.  Using defaults: '+e);
		  return config;
		}
	}
	
	for(var key in override) {
		console.log("Overriding property: KEY="+key+" VAL="+JSON.stringify(override[key]));
		config[key] = override[key];
	}
	return config;
};

module.exports = loadConfiguration();