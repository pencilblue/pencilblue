/**
 * TemplateService - Loads HTML templates
 * @author Brian Hyder
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 * @param services
 * @param name
 */
function TemplateService(services, name){
	this.services = services;
	this.name     = name;
}

//inheritance
util.inherits(TemplateService, pb.SimpleLayeredService);

//constants
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
				instance.transform(defaultTemplateData, pageName, metaDesc, fileLocation, doSubTemplates, cb);
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

TemplateService.prototype.getTemplatesForActiveTheme = function(cb) {
	var self = this;
	
	pb.settings.get('active_theme', function(err, activeTheme) {
        if(util.isError(err) || activeTheme == null) {
        	cb([]);
        	return;
        }
        
        var detailsLocation = path.join(DOCUMENT_ROOT, 'plugins', 'themes', activeTheme, 'details.json');
        self.get(detailsLocation, function(err, data) {
            if(util.isError(err) || data == null) {
                cb('');
                return;
            }
            
            var details = '';
            try{
            	details = JSON.parse(data);
            }
            catch(e){
            	pb.log.error('TemplateService:getTemplatesForActiveTheme: Failed to parse JSON from ['+detailsLocation+']', e);
            }
            cb(details.content_templates);
        });
    });
};

TemplateService.getDefaultPath = function(templateLocation){
	return DOCUMENT_ROOT + '/templates/' + templateLocation + '.html';
};

TemplateService.getCustomPath = function(themeName, templateLocation){
	return DOCUMENT_ROOT + '/themes/' + themeName + '/templates/' + templateLocation + '.html';
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
	
	//always add fs service
	services.push(new pb.FSEntityService(objType));
	
	return new TemplateService(services, 'TemplateService' + count++);
};

//exports
module.exports.TemplateService        = TemplateService;
module.exports.TemplateServiceFactory = TemplateServiceFactory;