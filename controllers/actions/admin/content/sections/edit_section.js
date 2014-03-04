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
	pb.utils.merge(this.query, post);
	
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
            self.formError('^loc_ERROR_SAVING^', '/admin/content/sections/section_map', output);
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
            formError('^loc_EXISTING_SECTION^', '/admin/content/sections/section_map', cb);
            return;
        }
        
        var where = {_id: {$ne: section._id}, $or: [{name: section['name']}, {url: section['url']}]};
        dao.count('section', where, function(err, count) {
            if(count > 0) {
                self.formError('^loc_EXISTING_SECTION^', '/admin/content/sections/section_map', cb);
                return;
            }
            
            dao.update(section).then(function(data) {
                if(util.isError(data)) {
                    self.formError('^loc_ERROR_SAVING^', '/admin/content/sections/section_map', cb);
                    return;
                }
                
                self.session.success = section.name + ' ^loc_EDITED^';
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
	//only check if a parent exists
    if(!section['parent']) {
        cb();
        return;
    }
        
    var sectionUID = section._id.toString();

    pb.settings.get('section_map', function(err, sectionMap) {
        if(sectionMap == null) {
            cb();
            return;
        }
        
        var sectionMapElement = null;
        for(var i = 0; i < sectionMap.length; i++) {
            
        	for(var j = 0; j < sectionMap[i].children.length; j++) {
                
        		if(sectionMap[i].children[j].uid == sectionUID) {
                    
        			if(sectionMap[i].uid != section['parent']) {
                        sectionMapElement = sectionMap[i].children[j];
                        sectionMap[i].children.splice(j, 1);
                    }
                    break;
                }
            }
        }
        
        if(!sectionMapElement) {
            cb();
            return;
        }
        
        for(var i = 0; i < sectionMap.length; i++) {
            if(sectionMap[i].uid == section['parent'])  {
                sectionMap[i].children.push(sectionMapElement);
                break;
            }
        }
        
        pb.settings.set('section_map', sectionMap, cb);
    });
};

//exports
module.exports = EditSection;
