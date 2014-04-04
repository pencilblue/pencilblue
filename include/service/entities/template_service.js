/**
 * TemplateService - A templating engine.
 * @param localizationService
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
 * 
 */
var GLOBAL_CALLBACKS = {
	site_root: pb.config.siteRoot,
	site_name: pb.config.siteName
};

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
 * 
 * @param content
 * @param cb
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
 * 
 * @param flag
 * @param cb
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
 * 
 * @param flag
 * @param cb
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
 * 
 * @param flag
 * @param replacement
 * @param cb
 */
TemplateService.prototype.handleReplacement = function(flag, replacement, cb) {
	if (typeof replacement === 'function') {
		replacement(flag, cb);
	}
	else {
		cb(null, replacement);
	}
};

/**
 * 
 * @param key
 * @param callbackFunctionOrValue
 * @returns {Boolean}
 */
TemplateService.prototype.registerLocal = function(key, callbackFunctionOrValue) {
	this.localCallbacks[key] = callbackFunctionOrValue;
	return true;
};

/**
 * 
 * @param cb
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
 * 
 * @param key
 * @param callbackFunctionOrValue
 * @returns {Boolean}
 */
TemplateService.registerGlobal = function(key, callbackFunctionOrValue) {
	GLOBAL_CALLBACKS[key] = callbackFunctionOrValue;
	return true;
};

TemplateService.getDefaultPath = function(templateLocation){
	return path.join(DOCUMENT_ROOT, 'templates', templateLocation + '.html');
};

TemplateService.getCustomPath = function(themeName, templateLocation){
	return path.join(DOCUMENT_ROOT, 'plugins', themeName, 'templates', templateLocation + '.html');
};

//exports
module.exports = TemplateService;
