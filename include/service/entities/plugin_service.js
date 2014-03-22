/**
 *
 */
function PluginService(){}

//constants
var PLUGINS_DIR       = path.join(DOCUMENT_ROOT, 'plugins');
var DETAILS_FILE_NAME = 'details.json';
var PUBLIC_DIR_NAME   = 'public';

var UID_REGEX     = /^[a-zA-Z0-9-_]+$/;
var VERSION_REGEX = /^[0-9]+\.[0-9]+\.[0-9]+/;

PluginService.getPublicPath = function(pluginDirName) {
	return path.join(PLUGINS_DIR, pluginDirName, PUBLIC_DIR_NAME);
};

/**
 * Constructs the path to a specific plugin's details.json file
 * @return {string} The absolute file path to the details.json file for a plugin
 */
PluginService.getDetailsPath = function(pluginDirName) {
	return path.join(PLUGINS_DIR, pluginDirName, DETAILS_FILE_NAME);
};

PluginService.loadDetailsFile = function(filePath, cb) {
	fs.readFile(filePath, function(err, data){
		if (util.isError(err)) {
			cb(err, null);
			return;
		}
		
		//atempt to parse the json
		try {
			cb(null, JSON.parse(data));
		}
		catch(e) {
			cb(e, null);
		}
	});
};

PluginService.validateDetails = function(details, pluginDirName, cb) {
	if (!details) {
		cb(new Error("Details cannot be null"), false);
		return;
	}
	
	//validate uid
	var errors = [];
	if (!pb.utils.isString(details.uid) || details.uid.search(UID_REGEX) == -1) {
		errors.push(new Error("The uid field must be provided and can only contain alphanumerics, underscores, and dashes"));
	}
	
	//validate display name
	if (!pb.utils.isString(details.name) || details.name.length <= 0) {
		errors.push(new Error("A valid name must be provided"));
	}
	
	//validate description
	if (!pb.utils.isString(details.description) || details.description.length <= 0) {
		errors.push(new Error("A valid description must be provided"));
	}
	
	//validate version
	if (!pb.utils.isString(details.version) || details.version.search(VERSION_REGEX) == -1) {
		errors.push(new Error("The uid field must be provided and can only contain alphanumerics, underscores, and dashes"));
	}
	
	//validate icon
	if (details.icon) {
		if (!pb.utils.isString(details.icon) || !PluginService.validateIconPath(details.icon, pluginDirName)) {
			errors.push(new Error("The optional plugin icon must be a valid path to an image"));
		}
	}
	
	//validate author block
};

PluginService.validateIconPath = function(path, pluginDirName) {
	var pluginPublicIcon = path.join(PluginService.getPublicPath(pluginDirName), path);
	var paths            = [pluginPublicIcon, path];
	
	for (var i = 0; i < paths.length; i++) {
		if (fs.existsSync(paths[i])) {
			return true;
		}
	}	
	return false;
};

//exports
module.exports = PluginService;
