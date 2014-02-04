global.getHTMLTemplate = function(templateLocation, pageName, metaDesc, output)
{
    var fileLocation = DOCUMENT_ROOT + '/templates/' + templateLocation + '.html';
    var instance = this;
    
    this.loadTemplate = function()
    {
        // Load the header template HTML and customize
        fs.readFile(fileLocation, function(error, data)
        {
            if(data)
            {
                templateString = data.toString();
            }
            else
            {
                templateString = '';
            }
            
            templateString = templateString.split('^site_name^').join(pb.config.siteName);
            templateString = templateString.split('^site_root^').join(pb.config.siteRoot);
            if(typeof pageName !== "undefined")
            {
                templateString = templateString.split('^page_name^').join(pageName);
            }
            else
            {
                templateString = templateString.split('^page_name^').join('');
            }
            
            if(typeof metaDesc !== "undefined")
            {
                templateString = templateString.split('^meta_desc^').join(metaDesc);
            }
            else
            {
                templateString = templateString.split('^meta_desc^').join(pb.config.siteName + ' | ' + pageName);
            }
            
            templateString = templateString.split('^year^').join(new Date().getFullYear());
            
            var subTemplateCount = templateString.split('^tmp_').length;
            
            if(subTemplateCount == 1)
            {
                output(templateString);
                return;
            }
            
            instance.loadSubTemplate(templateString, output);
        });
    };
    
    this.loadSubTemplate = function(templateString, output)
    {
        var instance = this;
    
        var startIndex = templateString.indexOf('^tmp_') + 5;
        var endIndex = templateString.substr(startIndex).indexOf('^');
        var templateName = templateString.substr(startIndex, endIndex);
        
        getHTMLTemplate(templateName.split('=').join('/'), pageName, metaDesc, function(data)
        {
            templateString = templateString.split('^tmp_' + templateName + '^').join(data);
            
            var subTemplateCount = templateString.split('^tmp_').length;
            
            if(subTemplateCount == 1)
            {
                output(templateString);
                return;
            }
            
            instance.loadSubTemplate(templateString, output);
        });
    };

    pb.log.debug("Templates: "+JSON.stringify(pb.settings));
    pb.settings.get('active_theme', function(err, setting){
    	if (setting == null){
    		instance.loadTemplate();
    		return;
    	}
    	
    	var templatePath = DOCUMENT_ROOT + '/plugins/themes/' + setting + '/templates/' + templateLocation + '.html';
    	fs.exists(templatePath, function(exists) {
            if (exists) {
                fileLocation = templatePath;
            }
            instance.loadTemplate();
        });
    });
};

function TemplateService(services, name){
	this.services = services;
	this.name     = name;
}

util.inherits(TemplateService, pb.SimpleLayeredService);

TemplateService.SEP = '^';
TemplateService.PREFIX = TemplateService.SEP+'tmp_';

TemplateService.prototype.load = function(templateLocation, pageName, metaDesc, cb) {
	this._load(templateLocation, pageName, metaDesc, true, cb);
};

TemplateService.prototype._load = function(templateLocation, pageName, metaDesc, doSubTemplates, cb) {
	var fileLocation = TemplateService.getDefaultPath(templateLocation);
	
	//cehck for an active theme
	var instance = this;
    pb.settings.get('active_theme', function(err, setting){
    	if (setting == null){
    		
    		//just load default template
			instance.get(fileLocation, function(err, defaultTemplateData){
				instance.transform(defaultTemplateData, pageName, metaDesc, fileLocation, cb);
			});
    		return;
    	}
    	
    	//check if custom these exists
    	var templatePath = TemplateService.getCustomPath(setting, templateLocation);
    	instance.get(templatePath, function(err, customTemplateData) {
    		
    		//custom template wasn't found
    		if(customTemplateData == null) {
    			
    			//just load default template
    			instance.get(fileLocation, function(err, defaultTemplateData){
    				instance.transform(defaultTemplateData, pageName, metaDesc, fileLocation, doSubTemplates, cb);
    			});
    		}
    		else{
    			instance.transform(customTemplateData, pageName, metaDesc, templatePath, doSubTemplates, cb);
    		}
    	});
    });
};

TemplateService.prototype.transform = function(templateString, pageName, metaDesc, templatePath, doSubTemplates, cb){
	if(templateString == null){
		pb.log.warn('TemplateService: No template was found for page ['+pageName+'] at location ['+templatePath+']');
        cb('');
        return;
    }
    
	//set site name and root
    templateString = templateString.split('^site_name^').join(pb.config.siteName);
    templateString = templateString.split('^site_root^').join(pb.config.siteRoot);
    
    //set page title
    pageName       = pageName ? pageName : '';
    templateString = templateString.split('^page_name^').join(pageName);

    //set meta description
    metaDesc = metaDesc ? metaDesc : pb.config.siteName + ' | ' + pageName;
    templateString = templateString.split('^meta_desc^').join(metaDesc);

    //set year
    templateString = templateString.split('^year^').join(new Date().getFullYear());
    
    //verify sub-templates should be check for
    if (!doSubTemplates) {
    	cb(templateString);
    	return;
    }
    
    //check for sub templates
    var self = this;
    async.whilst(
	    function () { return templateString.indexOf('^tmp_') >= 0; },
	    function (callback) {
	    	
	    	var startIndex      = templateString.indexOf(TemplateService.PREFIX) + TemplateService.PREFIX.length;
	        var endIndex        = templateString.substr(startIndex).indexOf(TemplateService.SEP);
	        var templateName    = templateString.substr(startIndex, endIndex);
	        var subtemplatePath = templateName.split('=').join('/');
	        
	        pb.log.silly(self.name+": Loading SubTemplate ["+subtemplatePath+"] Parent ["+templatePath+']');
	        self._load(subtemplatePath, pageName, metaDesc, false, function(subTemplateStr){
	        	templateString = templateString.split(TemplateService.PREFIX + templateName + TemplateService.SEP).join(subTemplateStr);
	        	callback();
	        });
	    },
	    function (err) {
	        cb(templateString);
	    }
	);
};

TemplateService.prototype.loadSubTemplate = function(templateString, pageName, metaDesc, cb){
    var self         = this;
    var startIndex   = templateString.indexOf(TemplateService.PREFIX) + TemplateService.PREFIX.length;
    var endIndex     = templateString.substr(startIndex).indexOf(TemplateService.SEP);
    var templateName = templateString.substr(startIndex, endIndex);
    
    var templatePath = templateName.split('=').join('/');
    
    pb.log.silly(this.name+": Loading SubTemplate ["+templatePath+"]");
    this.load(templatePath, pageName, metaDesc, function(data) {
        
    	templateString = templateString.split(TemplateService.PREFIX + templateName + TemplateService.SEP).join(data);
        
    	//check for sub template
        var subTemplateExists = templateString.indexOf('^tmp_');
        if(subTemplateExists){
        	self.loadSubTemplate(templateString, pageName, metaDesc, cb);
            return;
        }
        
        cb(templateString);
    });
};

TemplateService.getDefaultPath = function(templateLocation){
	return DOCUMENT_ROOT + '/templates/' + templateLocation + '.html';
};

TemplateService.getCustomPath = function(themeName, templateLocation){
	return DOCUMENT_ROOT + '/plugins/themes/' + themeName + '/templates/' + templateLocation + '.html';
};

TemplateService.getPlaceholder = function(name){
	return TemplateService.SEP+name+TemplateService.SEP;
};

function TemplateServiceFactory(){}

var count = 1;

TemplateServiceFactory.getService = function(useMemory, useCache) {
	var objType    = 'template';
	var services = [];
	
	//add in-memory service
	if (useMemory){
		services.push(new pb.MemoryEntityService(objType));
	}
	
	//add cache service
	if (useCache) {
		services.push(new pb.CacheEntityService(objType));
	}
	
	//always add db service
	services.push(new pb.FSEntityService(objType));
	
	return new TemplateService(services, 'TemplateService' + count++);
};

//exports
module.exports.TemplateService        = TemplateService;
module.exports.TemplateServiceFactory = TemplateServiceFactory;