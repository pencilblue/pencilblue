/**
 * EditSection - Edits a site section
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditSection(){
	this.wasContainer = false;
}

//inheritance
util.inherits(EditSection, pb.FormController);

EditSection.prototype.onPostParamsRetrieved = function(post, cb){
	var self = this;
	
	//load object
	this.getObject(post, function(err, navItem) {
		if (util.isError(err)) {
			throw err;
		}
		else if (!pb.utils.isObject(navItem)) {
			self.reqHandler.serve404();
			return;
		}
		
		//ensure a URL was provided
        if(!navItem.url && navItem.name) {
            navItem.url = navItem.name.toLowerCase().split(' ').join('-');
        }
		
		//strip unneeded properties
		pb.SectionService.trimForType(navItem);
		
		//validate
		var navService = new pb.SectionService();
		navService.validate(navItem, function(err, validationErrors) {
			if (util.isError(err)) {
				throw err;
			}
			else if (validationErrors.length > 0) {
				self.setFormFieldValues(post);
				var errMsg = EditSection.getHtmlErrorMsg(validationErrors);
				var redirect = self.getFormLocation();
				self.formError(errMsg, redirect, cb);
				return;
			}
			
			//persist the changes
			var dao = new pb.DAO();
			dao.update(navItem).then(function(data) {
                if(util.isError(data)) {
                	self.setFormFieldValues(post);
                    self.formError(self.ls.get('ERROR_SAVING'), self.getFormLocation(), cb);
                    return;
                }
                
                //update the navigation map
                self.checkForNavMapUpdate(navItem, function() {       
                	
                	//ok, now we can delete the orhphans if they exist
                	self.deleteOrphans(navItem, function(err, orphanCount) {
                		if(util.isError(err)) {
                            self.formError(self.ls.get('ERROR_SAVING'), self.getFormLocation(), cb);
                            return;
                        }
                	
                		//finally do the callback
                		self.session.success = self.getSuccessMessage(navItem);
                    	cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/sections/section_map'));
                	});
            	});
            });
		});
	});
};

EditSection.prototype.deleteOrphans = function(navItem, cb) {
	var service = new pb.SectionService();
	service.deleteChildren(navItem._id, cb);
};

EditSection.prototype.getSuccessMessage = function(navItem) {
	return navItem.name + ' ' + this.ls.get('EDITED');
};

EditSection.prototype.getFormLocation = function() {
	return pb.UrlService.urlJoin('/admin/content/sections/edit_section', this.pathVars.id);
};

EditSection.prototype.getObject = function(post, cb) {
	var self = this;
	var dao  = new pb.DAO();
	dao.loadById(this.pathVars.id, 'section', function(err, navItem) {
		if (util.isError(err)) {
			cb(err, null);
			return;
		}
		else if (!pb.utils.isObject(navItem)) {
			cb(null, null);
			return;
		}
		
		//determine if nav item is no longer a container
		//we'll later have to deal with the orphans (if any)
		self.wasContainer = navItem.type === 'container';
		
		//merge in new properties
		pb.DocumentCreator.update(post, navItem, ['keywords'], ['url', 'parent']);
		cb(null, navItem);
	});
};

EditSection.prototype.checkForNavMapUpdate = function(navItem, cb) {
	var service = new pb.SectionService();
	service.updateNavMap(navItem, cb);
};

EditSection.getHtmlErrorMsg = function(validationErrors) {
	var html = '';
	for (var i = 0; i < validationErrors.length; i++) {
		if (i > 0) {
			html += '<br/>';
		}
		html += validationErrors[i].field + ':' + validationErrors[i].message;
	}
	return html;
};

//exports
module.exports = EditSection;
