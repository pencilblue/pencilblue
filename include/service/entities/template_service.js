/**
 * A templating engine that provides the ability to read in file snippets and 
 * call back for data based on the flags in the template file.  The instance 
 * can be provided a Localization instance which will be used to perform 
 * translations for localization flags are encountered.  Flags are marked in 
 * html files by the pattern ^xzy^.  The values provided here are not HTML 
 * encoded.  Any reserved characters must be manually encoded by any flag 
 * call backs.
 * 
 * @class TemplateService
 * @constructor
 * @module Service
 * @submodule Entities
 * @param {Localization} localizationService
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC. All Rights Reserved
 */
function TemplateService(localizationService){
	this.localCallbacks      = {
		year: (new Date()).getFullYear()
	};
	
	this.localizationService = null;
	if (localizationService) {
		this.localizationService = localizationService;
	}
	
	//ensure template loader is initialized
	if (TEMPLATE_LOADER === null) {
		var objType  = 'template';
		var services = [];
		
		//add in-memory service
		if (pb.config.templates.use_memory){
			services.push(new pb.MemoryEntityService(objType));
		}
		
		//add cache service
		if (pb.config.templates.use_cache) {
			services.push(new pb.CacheEntityService(objType));
		}
		
		//always add fs service
		services.push(new pb.FSEntityService(objType));
		
		TEMPLATE_LOADER = new pb.SimpleLayeredService(services, 'TemplateService');
	}
};

//constants
var TEMPLATE_PREFIX         = 'tmp_';
var TEMPLATE_PREFIX_LEN     = TEMPLATE_PREFIX.length;
var LOCALIZATION_PREFIX     = 'loc_';
var LOCALIZATION_PREFIX_LEN = LOCALIZATION_PREFIX.length;

var TEMPLATE_LOADER = null;

/**
 * A container that provides the mapping for global call backs.  These should 
 * only be added to at the start of the application or on plugin install/update.
 */
var GLOBAL_CALLBACKS = {
	site_root: pb.config.siteRoot,
	site_name: pb.config.siteName
};

/**
 * Loads a template file along with any encountered sub-template files and 
 * processes any flags.  The call back provides any error encountered and a 
 * second parameter that is the transformed content.
 * 
 * @method load
 * @param {string} templateLocation The relative location of the template file 
 * in regards to one of the following locations:
 * <ol>
 * <li>pencilblue/templates/</>
 * <li>pencilblue/plugins/[active-theme]/templates/</li>
 * </ol>
 * @param {function} cb A call back that provides two parameters: cb(error, content)
 */
TemplateService.prototype.load = function(templateLocation, cb) {
	
var fileLocation = TemplateService.getDefaultPath(templateLocation);
	var self = this;
	
	//check for an active theme
    pb.settings.get('active_theme', function(err, setting){
    	if (setting == null){
    		if (pb.log.isSilly()) {
				pb.log.silly("TemplateService: No Theme Template. Loading default template [%s]", fileLocation);
			}
    		
    		//just load default template
    		TEMPLATE_LOADER.get(fileLocation, function(err, defaultTemplateData){
				self.process(defaultTemplateData, cb);
			});
    		return;
    	}
    	
    	//check if custom these exists
    	var templatePath = TemplateService.getCustomPath(setting, templateLocation);    	
    	TEMPLATE_LOADER.get(templatePath, function(err, customTemplateData) {
    		
    		//custom template wasn't found
    		if(customTemplateData == null) {
    			if (pb.log.isSilly()) {
    				pb.log.silly("TemplateService: Loading default template [%s]", fileLocation);
    			}
    			
    			//just load default template
    			TEMPLATE_LOADER.get(fileLocation, function(err, defaultTemplateData){
    				self.process(defaultTemplateData, cb);
    			});
    		}
    		else{
    			if (pb.log.isSilly()) {
    				pb.log.silly("TemplateService: Loaded themed [%s] template [%s]", setting, fileLocation);
    			}
    			self.process(customTemplateData, cb);
    		}
    	});
    });
};

/**
 * Scans the template for flags.  The callback provides any error and a second 
 * parameter that is the populated template with any registered flags replaced.
 * 
 * @method process
 * @param {string} content The raw content to be inspected for flags
 * @param {function} cb A call back that provides two parameters: cb(err, content)
 */
TemplateService.prototype.process = function(content, cb) {
	
	//error checking
	if (typeof content !== 'string') {
		cb(new Error("TemplateService: A valid content string is required in order for the template engine to process the value"), content);
		return;
	}
	
	//iterate content characters
	var self      = this;
	var rf        = false;
	var flag      = '';
	
	var cnt = 0;
	var doCallback = function(cb, err, val) {
		if (++cnt % 1000) {
			process.nextTick(function() {cb(err, val);});
		}
		else {
			cb(err, val);
		}
	};
	var getIteratorFunc = function(index) {
		return function(next) {
			
			var curr = content.charAt(index);
			switch (curr) {
			
			case '^':
				if (rf) {
					process.nextTick(function() {
						self.processFlag(flag, function(err, subContent) {						
							if (pb.log.isSilly()) {
								pb.log.silly("TemplateService: Processed flag [%s] Content=[%s]", flag, subContent ? (''+subContent).substring(0, 20)+'...': subContent);
							}
							rf   = false;
							flag = '';
							doCallback(next, null, subContent);
						});
					}, 0);
				}
				else {
					rf = true;
					doCallback(next, null, '');
				}
				break;
			default:
				if (rf) {
					flag += curr;
					doCallback(next, null, '');
				}
				else {
					doCallback(next, null, curr);
				}
			}
		};
	};
	var tasks = [];
	for (var i = 0; i < content.length; i++) {
		tasks.push(getIteratorFunc(i));
	};
	async.series(tasks, function(err, contentArray) {
		doCallback(cb, err, contentArray.join(''));
	});
};

/**
 * Called when a flag is encountered by the processing engine.  The function is 
 * responsible for delegating out the responsibility of the flag to the 
 * registered entity.  Some flags are handled by default (although they can 
 * always be overriden locally or globally).  The following flags are considered 
 * "baked in" and will be handled automatically unless overriden:
 * <ul>
 * <li>^loc_xyz^ - A localization flag.  When provided, the Localization 
 * instance will have its "get" function called in an attempt to retrieve the 
 * properly translated value for the key (the part betwee "^loc_" and the ending 
 * "^").
 * </li>
 * <li>^tmp_somedir=someotherdir=templatefileminusext^ - Specifies a 
 * sub-template that should be loaded processed.  The file is expected to have 
 * a .html extension.
 * </li>
 * </ul>
 * 
 * @method processFlag
 * @param {string} flag The flag to be processed.  The value should NOT contain 
 * the carrot (^) prefix or postfix.
 * @param {function} cb A call back that provides two parameters: cb(err, content)
 */
TemplateService.prototype.processFlag = function(flag, cb) {
	var self = this;
	
	//check local
	var tmp;
	if (tmp = this.localCallbacks[flag]) {//local callbacks
		self.handleReplacement(flag, tmp, cb);
		return;
	}
	else if (tmp = GLOBAL_CALLBACKS[flag]) {//global callbacks
		self.handleReplacement(flag, tmp, cb);
		return;
	}
	else if (flag.indexOf(LOCALIZATION_PREFIX) == 0 && this.localizationService) {//localization
		cb(null, this.localizationService.get(flag.substring(LOCALIZATION_PREFIX_LEN)));
	}
	else if (flag.indexOf(TEMPLATE_PREFIX) == 0) {//sub-templates
		this.handleTemplateReplacement(flag, function(err, template) {
			cb(null, template);
		});
	}
	else {
		//log result
		if (pb.log.isSilly()) {
			pb.log.silly("TemplateService: Failed to process flag [%s]", flag);
		}
		cb(null, '^'+flag+'^');
	}
};

/**
 * When a sub-template flag is encountered by the processing engine this 
 * function is called to parse the flag and delegate out the loading and 
 * processing of the sub-template.
 * 
 * @method handleTemplateReplacement
 * @param {string} flag The sub-template flag
 * @param {function} cb A call back that provides two parameters: cb(err, content)
 */
TemplateService.prototype.handleTemplateReplacement = function(flag, cb) {
	var pattern      = flag.substring(TEMPLATE_PREFIX_LEN);
	var templatePath = pattern.replace(/=/g, path.sep);
	
	if (pb.log.isSilly()) {
		pb.log.silly("Template Serice: Loading Sub-Template. FLAG=[%s] Path=[%s]", flag, templatePath);
	}
	this.load(templatePath, function(err, template) {
		cb(err, template);
	});
};

/**
 * Called when the processing engine encounters a non-sub-template flag.  The 
 * function delegates the content transformation out to either the locally or 
 * globally register function.  In the even that a value was registered and not 
 * a function then the value is used as the second parameter in the callback.  
 * During template re-assembly the value will be converted to a string.
 * 
 * @method handleReplacement
 * @param {string} flag The flag to transform
 * @param {mixed} replacement The value can either be a function to handle the 
 * replacement or a value.
 * @param {function} cb {function} cb A call back that provides two parameters: cb(err, content)
 */
TemplateService.prototype.handleReplacement = function(flag, replacement, cb) {
	var self    = this;
	var handler = function(err, content) {
		self.process(content, cb);
	};
	if (typeof replacement === 'function') {
		replacement(flag, handler);
	}
	else {
		handler(null, replacement);
	}
};

/**
 * Registers a value or function for the specified
 * 
 * @method registerLocal
 * @param {string} flag The flag name to map to the value when encountered in a 
 * template.
 * @param {mixed} callbackFunctionOrValue The function to execute to perform the 
 * transformation or the value to substitute in place of the flag.
 * @returns {Boolean} TRUE when registered successfully, FALSE if not
 */
TemplateService.prototype.registerLocal = function(flag, callbackFunctionOrValue) {
	this.localCallbacks[flag] = callbackFunctionOrValue;
	return true;
};

/**
 * Retrieves the content template names and locations for the active theme.
 * 
 * @method getTemplatesForActiveTheme
 * @param {function} cb A call back that provides two parameters: cb(err, [{templateName: templateLocation])
 */
TemplateService.prototype.getTemplatesForActiveTheme = function(cb) {
	
	pb.settings.get('active_theme', function(err, activeTheme) {
        if(util.isError(err) || activeTheme == null) {
        	cb(err, []);
        	return;
        }
        
        var detailsLocation = pb.PluginService.getDetailsPath(activeTheme);console.log(detailsLocation);
        TEMPLATE_LOADER.get(detailsLocation, function(err, data) {
            if(util.isError(err) || data == null) {
                cb(err, []);
                return;
            }
            
            var details = '';
            try{
            	details = JSON.parse(data);
            }
            catch(e){
            	pb.log.error('TemplateService:getTemplatesForActiveTheme: Failed to parse JSON from ['+detailsLocation+']', e);
            	cb(e, []);
            	return;
            }
            cb(null, details.content_templates);
        });
    });
};

/**
 * Registers a value or function for the specified
 * 
 * @static
 * @method registerGlobal
 * @param {string} flag The flag name to map to the value when encountered in a 
 * template.
 * @param {mixed} callbackFunctionOrValue The function to execute to perform the 
 * transformation or the value to substitute in place of the flag.
 * @returns {Boolean} TRUE when registered successfully, FALSE if not
 */
TemplateService.registerGlobal = function(key, callbackFunctionOrValue) {
	GLOBAL_CALLBACKS[key] = callbackFunctionOrValue;
	return true;
};

/**
 * Retrieves the default path to a template file based on the assumption that 
 * the provided path is relative to the pencilblue/templates/ directory.
 * 
 * @static
 * @method getDefaultPath
 * @param {string} templateLocation
 * @returns {string} The absolute path
 */
TemplateService.getDefaultPath = function(templateLocation){
	return path.join(DOCUMENT_ROOT, 'templates', templateLocation + '.html');
};

/**
 * Retrieves the path to a template file based on the assumption that 
 * the provided path is relative to the pencilblue/plugins/[themeName]/templates/ directory.
 * 
 * @static
 * @method getCustomPath
 * @param {string} templateLocation
 * @returns {string} The absolute path
 */
TemplateService.getCustomPath = function(themeName, templateLocation){
	return path.join(DOCUMENT_ROOT, 'plugins', themeName, 'templates', templateLocation + '.html');
};

//exports
module.exports = TemplateService;
