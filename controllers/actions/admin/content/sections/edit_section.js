/**
 * EditSection - Edits a site section
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditSection(){}

//inheritance
util.inherits(EditSection, pb.FormController);

EditSection.prototype.onPostParamsRetrieved = function(post, cb){
	var self = this;
	
	//merge in get params
	pb.utils.merge(this.pathVars, post);
	
	//load object
	var dao = new pb.DAO();
	dao.loadById(post.id, 'section', function(err, navItem) {
		if (util.isError(err)) {
			throw err;
		}
		else if (!pb.utils.isObject(navItem)) {
			self.reqHandler.serve404();
			return;
		}
		
		//merge in new properties
		pb.DocumentCreator.update(post, navItem, ['keywords'], ['url', 'parent']);
		
		//ensure a URL
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
				var redirect = pb.UrlService.urlJoin('/admin/content/sections/edit_section/', post.id);
				self.formError(errMsg, redirect, cb);
				return;
			}
			
			dao.update(navItem).then(function(data) {
                if(util.isError(data)) {
                	self.setFormFieldValues(post);
                    self.formError(self.ls.get('ERROR_SAVING'), pb.UrlService.urlJoin('/admin/content/sections/edit_section', post.id), cb);
                    return;
                }
                
                self.checkForSectionMapUpdate(navItem, function() {       
                	
                	self.session.success = navItem.name + ' ' + self.ls.get('EDITED');
                    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/sections/section_map'));
                });
            });
		});
	});
};

EditSection.prototype.getRequiredFields = function() {
	return ['id', 'name', 'editor'];
};

EditSection.prototype.checkForSectionMapUpdate = function(section, cb) {
	var service = new pb.SectionService();
	service.updateSectionMap(section, cb);
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
