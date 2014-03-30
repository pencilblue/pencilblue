/**
 * Organizes the site's sections via drag and drop
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function SectionMap(){}

//dependencies
var Sections = require('../sections');

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
            
            self.setPageName(self.ls.get('SECTION_MAP'));
	        self.ts.load('admin/content/sections/section_map', function(err, data) {
                var result = data;

                var pills = Sections.getPillNavOptions('section_map');
                pills.unshift(
                {
                    name: 'section_map',
                    title: self.ls.get('SECTION_MAP'),
                    icon: 'refresh',
                    href: '/admin/content/sections/section_map'
                });
                
                var objects     = {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'sections'], self.ls),
                    pills: pills,
                    sections: SectionMap.getOrderedSections(sections, sectionMap)
                };
                var angularData = pb.js.getAngularController(objects);
                result          = result.concat(angularData);
                
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
