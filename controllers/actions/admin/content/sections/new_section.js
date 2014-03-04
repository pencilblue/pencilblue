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
        this.formError('^loc_EXISTING_SECTION^', '/admin/content/sections/new_section', output);
        return;
    }
    
    var dao = new pb.DAO();
    dao.count('section', {$or: [{name: sectionDocument['name']}, {url: sectionDocument['url']}]}, function(err, count) {
        //TODO handle error
    	
    	//make sure there isn't an existing section with the given name or URL
    	if (count > 0) {
            self.formError('^loc_EXISTING_SECTION^', '/admin/content/sections/new_section', output);
            return;
        }
        
    	dao.update(sectionDocument).then(function(data) {
            if(util.isError(data)) {
                self.formError('^loc_ERROR_SAVING^', '/admin/content/sections/new_section', output);
                return;
            }
            
            self.session.success = sectionDocument.name + ' ^loc_CREATED^';
            
            self.checkForSectionMap(sectionDocument, function() {                
                cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/sections/new_section'));
            });
        });
    });
};

NewSection.prototype.checkForSectionMap = function(sectionDocument, cb) {
	   
    var sectionUID = sectionDocument._id.toString();
    pb.settings.get('section_map', function(err, data) {
    	
        if(data == null) {
            
        	var value = [
	             {
	            	 uid: sectionUID, 
	            	 children: []
	             }
            ];
        	pb.settings.set('section_map', value, cb);
            return;
        }
        
        var sectionMap = data;
        if (!sectionDocument['parent']) {
            sectionMap.push({uid: sectionUID, children: []});
        }
        else {
            for (var i = 0; i < sectionMap.length; i++) {
                if (sectionMap[i].uid == sectionDocument['parent']) {
                    sectionMap[i].children.push({uid: sectionUID});
                    break;
                }
            }
        }
        
        pb.settings.set('section_map', sectionMap, cb);
    });
};

//exports
module.exports = NewSection;
