/**
 * DeleteSection - Deletes a site section
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function DeleteSection(){}

//inheritance
util.inherits(DeleteSection, pb.BaseController);

DeleteSection.prototype.render = function(cb) {
	var self    = this;
	var vars    = this.pathVars;
	
	var message = this.hasRequiredParams(vars, ['id']);
	if (message) {
        this.formError(message, '/admin/content/sections/section_map', cb);
        return;
    }
    
	//ensure existence
	var dao = new pb.DAO();
	dao.loadById(vars['id'], 'section', function(err, section) {
        if(section == null) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/sections/section_map', cb);
            return;
        }
        
        //delete the section
        var where = {$or: [{_id: ObjectID(vars['id'])}, {parent: vars['id']}]};
        dao.deleteMatching(where, 'section').then(function(result) {
        	if(result < 1) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/sections/section_map', cb);
                return;
            }
        	
            self.session.success = section.name + ' ' + self.ls.get('DELETED');
            self.updateSectionMap(vars['id'], function(err, result) {
                cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/sections/section_map'));
            });
        });
    });
};

DeleteSection.prototype.updateSectionMap = function(removeID, cb) {
	var service = new pb.SectionService();
	service.removeFromSectionMap(removeID, cb);
};

//exports
module.exports = DeleteSection;
