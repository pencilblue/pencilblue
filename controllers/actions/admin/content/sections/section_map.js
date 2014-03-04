/**
 * SectionMap - Saves a reorganized section map
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function SectionMap(){}

//inheritance
util.inherits(SectionMap, pb.FormController);

SectionMap.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	
	var message = this.hasRequiredParams(post, ['map']);
	if(message) {
        this.formError(message, '/admin/content/sections/section_map', cb);
        return;
    }
    
    var sectionMap = JSON.parse(decodeURIComponent(post['map']));
    if(sectionMap.length <= 0 || !sectionMap[0].uid) {
        this.formError('^loc_ERROR_SAVING^', '/admin/content/sections/section_map', cb);
        return;
    }
    
    pb.settings.set('section_map', sectionMap, function(err, data) {
		if(util.isError(err)) {
            self.formError('^loc_ERROR_SAVING^', '/admin/content/sections/section_map', cb);
            return;
        }
        
        self.session.success = '^loc_SECTION_MAP_SAVED^';
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/sections/section_map'));
    });
};

//exports
module.exports = SectionMap;
