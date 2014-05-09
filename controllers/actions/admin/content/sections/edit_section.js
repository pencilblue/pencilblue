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
	var vars = this.pathVars;
	
	//merge in get params
	pb.utils.merge(this.pathVars, post);
	
	//verify required parameters exist
	var message = this.hasRequiredParams(post, this.getRequiredFields());
    if(message) {
        this.formError(message, '/admin/content/sections/section_map', cb);
        return;
    }
    
    var dao = new pb.DAO();
    dao.loadById(post.id, 'section', function(err, section) {
    	//TODO handle error
    	
        if(section == null) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/sections/section_map', cb);
            return;
        }

        //update existing document
        pb.DocumentCreator.update(post, section, ['keywords'], ['url', 'parent']);
        
        //ensure a URL was provided
        if(!section['url']) {
            section['url'] = section['name'].toLowerCase().split(' ').join('-');
        }
        
        //now start validation
        //check for reserved names
        if(section['name'] == 'admin') {
            formError(self.ls.get('EXISTING_SECTION'), '/admin/content/sections/section_map', cb);
            return;
        }
        
        var where = {_id: {$ne: section._id}, $or: [{name: section['name']}, {url: section['url']}]};
        dao.count('section', where, function(err, count) {
            if(count > 0) {
                self.formError(self.ls.get('EXISTING_SECTION'), '/admin/content/sections/section_map', cb);
                return;
            }
            
            dao.update(section).then(function(data) {
                if(util.isError(data)) {
                    self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/sections/section_map', cb);
                    return;
                }
                
                self.session.success = section.name + ' ' + self.ls.get('EDITED');
                self.checkForSectionMapUpdate(section, function() {                
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

//exports
module.exports = EditSection;
