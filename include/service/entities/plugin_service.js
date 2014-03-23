/**
 *
 */
function PluginService(){}

//constants
var PLUGINS_DIR       = path.join(DOCUMENT_ROOT, 'plugins');
var DETAILS_FILE_NAME = 'details.json';
var PUBLIC_DIR_NAME   = 'public';

PluginService.getPublicPath = function(pluginDirName) {
	return path.join(PLUGINS_DIR, pluginDirName, PUBLIC_DIR_NAME);
};

PluginService.getPluginsDir = function() {
	return PLUGINS_DIR;
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
	
	//setup 
	var errors = [];
	var v      = pb.validation;
	
	//validate uid
	if (!v.validateSafeFileName(details.uid, true)) {
		errors.push(new Error("The uid field must be provided and can only contain alphanumerics, underscores, and dashes"));
	}
	
	//validate display name
	if (!v.validateNonEmptyStr(details.name, true)) {
		errors.push(new Error("An invalid name ["+details.name+"] was provided"));
	}
	
	//validate description
	if (!v.validateNonEmptyStr(details.description, true)) {
		errors.push(new Error("A valid description must be provided"));
	}
	
	//validate version
	if (!v.validateVersionNum(details.version, true)) {
		errors.push(new Error("An invalid version number ["+details.version+"] was provided.  Must match the form: xx.xx.xx"));
	}
	
	//validate icon
	if (details.icon) {
		if (!pb.utils.isString(details.icon) || !PluginService.validateIconPath(details.icon, pluginDirName)) {
			errors.push(new Error("The optional plugin icon must be a valid path to an image"));
		}
	}
	
	//validate author block
	if (details.author) {
		var author = details.author;
		
		//validate name
		if (!v.validateNonEmptyStr(author.name, true)) {
			errors.push(new Error("A valid author name must be provided"));
		}
		
		//validate email
		if (!v.validateEmail(author.email, true)) {
			errors.push(new Error("A valid author email must be provided"));
		}
		
		//validate website
		if (!v.validateUrl(author.website, false)) {
			errors.push(new Error("The website address is not a valid URL"));
		}
		
		//validate contributors
		if (author.contributors) {
			if (v.validateArray(author.contributors, true)) {
				
				for (var i = 0; i < author.contributors.length; i++) {
					
					var cont = author.contributors[i];
					if (v.validateObject(cont, true)) {
						
						//validate contributor name
						if (!v.validateNonEmptyStr(cont.name, true)) {
							errors.push(new Error("The contributor name at position "+i+" must be provided"));
						}
						
						//validate contributor email
						if (!v.validateEmail(cont.email, false)) {
							errors.push(new Error("The contributor email at position "+i+" is invalid"));
						}
					}
					else {
						errors.push(new Error("The contributor at position "+i+" must be an object"));
					}
				}
			}
			else {
				errors.push(new Error("The author contributors block must be an array"));
			}
		}
	}
	else {
		errors.push(new Error("The author block is required"));
	}
	
	//validate plugin settings
	if (details.settings) {
		
		if (v.validateArray(details.settings, true)) {
			
			//validate each setting
			for (var i = 0; i < details.settings.length; i++) {
				
				//set any errors derived
				var settingErrs = PluginService.validateSetting(details.settings[i], i);
				for (var j = 0; j < settingErrs.length; j++) {
					errors.push(settingErrs[j]);
				}
			}
		}
		else {
			errors.push(new Error("The settings block must be an array"));
		}
	}
	
	//validate permissions
	if (v.validateObject(details.permissions, true)) {
		
		var validKeys = {"ACCESS_USER": 1, "ACCESS_WRITER": 1, "ACCESS_EDITOR": 1, "ACCESS_MANAGING_EDITOR": 1};
		for (var key in details.permissions) {
			
			//validate permission key
			if (validKeys[key] === undefined) {
				errors.push("An invalid permissions map key ["+key+"] was provided");
			}
			else {
				var val = details.permissions[key];
				if (v.validateArray(val, true)) {
					
					for (var i = 0; i < details.permissions[key].length; i++) {
						if (!v.validateNonEmptyStr(details.permissions[key][i], true)) {
							errors.push(new Error("The value at position "+i+" for permissions map key ["+key+"] is invalid"));
						}
					}
				}
				else {
					errors.push("Permissions map key ["+key+"] was provided must provide an array of permissions");
				}
			}
		}
	}
	else {
		errors.push(new Error("The permissions block is required and must be an object"));
	}
	
	//validate main module
	if (v.validateObject(details.main_module, true)) {
		
		if (!PluginService.validateMainModulePath(details.main_module.path, pluginDirName)) {
			errors.push(new Error("An invalid main module path and/or file was provided"));
		}
	}
	else {
		errors.push(new Error("The main module block is required and must be an object"));
	}
	
	//validate theme
	if (details.theme) {
		
		if (v.validateObject(details.theme, true)) {
			
			//validate settings block
			if (details.theme.settings) {
				
				if (v.validateArray(details.theme.settings, true)) {
					
					//validate each setting
					for (var i = 0; i < details.theme.settings.length; i++) {
						
						//set any errors derived
						var settingErrs = PluginService.validateSetting(details.theme.settings[i], i);
						for (var j = 0; j < settingErrs.length; j++) {
							errors.push(settingErrs[j]);
						}
					}
				}
				else {
					errors.push(new Error("The theme settings block must be an array"));
				}
			}
			
			//validate theme content templates
			if (details.theme.content_templates) {
				
				if (v.validateArray(details.theme.content_templates, true)) {
					
					//validate each content template
					for (var i = 0; i < details.theme.content_templates.length; i++) {
						
						var template = details.theme.content_templates[i];
						if (v.validateObject(template, true)) {
							
							//validate content template name
							if (!v.validateNonEmptyStr(template.name, true)) {
								errors.push(new Error("The content template name at position "+i+" is invalid"));
							}
							
							//validate content template file
							if (!v.validateSafeFileName(template.file, true)) {
								errors.push(new Error("The content template file at position "+i+" is invalid"));
							}
						}
						else {
							errors.push(new Error("The content template at position "+i+" is invalid"));
						}
					}
				}
				else {
					errors.push(new Error("The content templates property must be an array"));
				}
			}
		}
		else {
			errors.push(new Error("The theme block must be an object"));
		}
	}
	
	//prepare validation response
	var error   = null;
	var isError = errors.length > 0;
	if (isError) {
		error = new Error("Faled to validate plugin details");
		error.validationErrors = errors;
	}
	cb(error, !isError);
};

PluginService.validateIconPath = function(iconPath, pluginDirName) {
	var pluginPublicIcon = path.join(PluginService.getPublicPath(pluginDirName), iconPath);
	var paths            = [pluginPublicIcon, iconPath];
	
	for (var i = 0; i < paths.length; i++) {
		if (fs.existsSync(paths[i])) {
			return true;
		}
	}	
	return false;
};

PluginService.validateMainModulePath = function(mmPath, pluginDirName) {
	var pluginPublicIcon = path.join(PLUGINS_DIR, pluginDirName, mmPath);
	var paths            = [pluginPublicIcon, mmPath];
	
	for (var i = 0; i < paths.length; i++) {
		try {console.log(paths[i]);
			return require(paths[i]) ? true : false;
		}
		catch(e) {}
	}	
	return false;
};

PluginService.validateSetting = function(setting, position) {
	
	//setup
	var errors = [];
	var v      = pb.validation;
	
	//validate object
	if (pb.utils.isObject(setting)) {
		
		//validate name
		if (!v.validateNonEmptyStr(setting.name, true)) {
			errors.push(new Error("The setting name at position "+position+" must be provided"));
		}
		
		//validate value
		if (!setting.value || (!pb.utils.isString(setting.value) && isNaN(setting.value))) {
			errors.push(new Error("The setting value at position "+position+" must be provided"));
		}
	}
	else {
		errors.push(new Error("The setting value at position "+position+" must be an object"));
	}

	return errors;
};

PluginService.getServices = function(pathToPlugin, cb) {
	var servicesDir = path.join(pathToPlugin, 'services');
	
	fs.readdir(servicesDir, function(err, files) {
		
		var services = {};
		var tasks = pb.utils.getTasks(files, function(files, index) {
			return function(callback) {
				
				var pathToService = path.join(servicesDir, files[index]);
				PluginService.loadService(pathToService, function(err, service) {
					if (!util.isError(err)) {
					
						var name = PluginService.getServiceName(pathToService, service);
						services[name] = service;
					}
					callback(null, true);
				});
			};
		});
		async.parallel(tasks, function(err, results) {
			cb(err, services);
		});
	});
};

PluginService.loadService = function(pathToService, cb) {
	try {
		pb.log.debug("PluginService: Attempting to load service ["+pathToService+"]");
		var service = require(pathToService);
		
		pb.log.debug("PluginService: Initializing service ["+pathToService+"]");
		service.init(function(err, result) {
			cb(err, service);
		});
	}
	catch(e){
		pb.log.error("PluginService: Failed to load service: ["+pathToService+"]: "+e.stack);
		cb(e, null);
	}
};

PluginService.getServiceName = function(pathToService, service) {
	var name = 'UNKNOWN';
	if (service && typeof service.getName === 'function') {
		name = service.getName();
	}
	else {
		var pieces = pathToService.split(path.sep);
		name       = pieces[pieces.length - 1];
		var index  = name.lastIndexOf('.');
		if (index > 0) {
			name = name.substring(0, index);
		}
	}
	return name;
};

//exports
module.exports = PluginService;
