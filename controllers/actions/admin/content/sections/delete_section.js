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
	var message = this.hasRequiredParams(this.query, ['id']);
	if (message) {
        this.formError(message, '/admin/content/sections/section_map', cb);
        return;
    }
    
	//ensure existence
	var dao = new pb.DAO();
	dao.loadById(this.query.id, 'section', function(err, section) {
        if(section == null) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/sections/section_map', cb);
            return;
        }
        
        //delete the section
        var where = {$or: [{_id: ObjectID(self.query['id'])}, {parent: self.query['id']}]};
        dao.deleteMatching(where, 'section').then(function(result) {
        	if(result < 1) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/sections/section_map', cb);
                return;
            }
        	
            self.session.success = section.name + ' ' + self.ls.get('DELETED');
            self.updateSectionMap(self.query.id, function(err, result) {
                cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/sections/section_map'));
            });
        });
    });
};

DeleteSection.prototype.updateSectionMap = function(removeID, cb) {
	pb.settings.get('section_map', function(sectionMap) {
        if (sectionMap == null) {
            cb();
            return;
        }
        
        //searh for section in map.
        for(var i = 0; i < sectionMap.length; i++) {
            if(sectionMap[i].uid == removeID) {
                sectionMap.splice(i, 1);
                break;
            }
            
            for(var j = 0; j < sectionMap[i].children.length; j++) {
                if(sectionMap[i].children[j].uid == removeID) {
                    sectionMap[i].children.splice(j, 1);
                    break;
                }
            }
        }
        
        pb.settings.set('section_map', sectionMap, cb);
    });
};

//exports
module.exports = DeleteSection;
