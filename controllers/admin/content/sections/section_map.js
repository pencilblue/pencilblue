/**
 * Organizes the site's sections via drag and drop
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function SectionMap(){}

//dependencies
var SectionService = pb.SectionService;

//inheritance
util.inherits(SectionMap, pb.BaseController);

SectionMap.prototype.render = function(cb) {
	var self = this;
	var dao  = new pb.DAO();
	dao.query('section', pb.DAO.ANYWHERE).then(function(sections) {
		
		//when no sections exist redirect to create page
        if(sections.length == 0) {
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/sections/new_section'));
            return;
        }

        pb.settings.get('section_map', function(err, sectionMap) {
            if(sectionMap == null) {
            	cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/sections/new_section'));
                return;
            }
            
            self.setPageName(self.ls.get('NAV_MAP'));
	        self.ts.load('admin/content/sections/section_map', function(err, data) {
                var result = data;

                var pills = SectionService.getPillNavOptions('section_map');
                pills.unshift(
                {
                    name: 'section_map',
                    title: self.getPageName(),
                    icon: 'refresh',
                    href: '/admin/content/sections/section_map'
                });
                
                var objects     = {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'sections'], self.ls),
                    pills: pills,
                    sections: SectionMap.getOrderedSections(sections, sectionMap),
                    icons: {
                    	container: 'fa-inbox',
                    	section: 'fa-th-large',
                    	article: 'fa-files-o',
                    	page: 'fa-file-o',
                    	link: 'fa-external-link'
                    }
                };
                
                var angularData = pb.js.getAngularController(objects);
                result          = result.split('^angular_script^').join(angularData);
                
                cb({content: result});
            });
        });
    });
};

SectionMap.getOrderedSections = function(sections, sectionMap) {

	var orderedSections = [];
    for(var i = 0; i < sectionMap.length; i++) {
        
    	var parentSection = null;
        for(var j = 0; j < sections.length; j++) {
            if(sectionMap[i].uid == sections[j]._id) {
                parentSection          = sections[j];
                parentSection.children = [];
                break;
            }
        }
        
        if(!parentSection) {
            continue;
        }
        
        for(var o = 0; o < sectionMap[i].children.length; o++) {
            for(var j = 0; j < sections.length; j++) {
                if(sectionMap[i].children[o].uid == sections[j]._id) {
                    parentSection.children.push(sections[j]);
                    break;
                }
            }
        }
        
        orderedSections.push(parentSection);
    }
    
    return orderedSections;
};

//exports
module.exports = SectionMap;
