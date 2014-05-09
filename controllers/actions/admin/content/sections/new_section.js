/**
 * NewSection - Creates a new site section
 *    
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewSection(){}

//inheritance
util.inherits(NewSection, pb.FormController);

NewSection.prototype.onPostParamsRetrieved = function(post, cb) {
	var self    = this;
	var message = this.hasRequiredParams(post, ['name', 'editor']);
	if (message) {
        this.formError(message, '/admin/content/sections/new_section', cb);
        return;
    }
    
    var sectionDocument = pb.DocumentCreator.create('section', post, ['keywords'], ['parent']);
    if (!sectionDocument['url']) {
        sectionDocument['url'] = sectionDocument['name'].toLowerCase().split(' ').join('-');
    }
    
    //check for reserved sections
    if(sectionDocument['name'] == 'admin') {
        this.formError(self.ls.get('EXISTING_SECTION'), '/admin/content/sections/new_section', cb);
        return;
    }
    
    var dao = new pb.DAO();
    dao.count('section', {$or: [{name: sectionDocument['name']}, {url: sectionDocument['url']}]}, function(err, count) {
        //TODO handle error
    	
    	//make sure there isn't an existing section with the given name or URL
    	if (count > 0) {
            self.formError(self.ls.get('EXISTING_SECTION'), '/admin/content/sections/new_section', cb);
            return;
        }
        
    	dao.update(sectionDocument).then(function(data) {
            if(util.isError(data)) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/sections/new_section', cb);
                return;
            }
            
            self.session.success = sectionDocument.name + ' ' + self.ls.get('CREATED');
            
            self.checkForSectionMap(sectionDocument, function() {                
                cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/sections/new_section'));
            });
        });
    });
};

NewSection.prototype.checkForSectionMap = function(section, cb) {
	 var service = new pb.SectionService();
	 service.updateSectionMap(section, cb);
};

//exports
module.exports = NewSection;
