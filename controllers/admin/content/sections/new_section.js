/**
 * NewSection - Input for creating a new site section
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewSection(){}

//inheritance
util.inherits(NewSection, pb.BaseController);

NewSection.prototype.render = function(cb) {
	var self = this;
	
	pb.templates.load('admin/content/sections/new_section', '^loc_NEW_SECTION^', null, function(data) {
        
        var tabs = [
            {
                active: 'active',
                href: '#section_settings',
                icon: 'cog',
                title: '^loc_SETTINGS^'
            },
            {
                href: '#section_seo',
                icon: 'tasks',
                title: '^loc_SEO^'
            }
        ];
            
        self.displayErrorOrSuccess(data, function(result) {
        
        	var dao = new pb.DAO();
        	dao.query('section', {parent: null}, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(parents) {                            
                
        		pb.users.getEditorSelectList(self.session.authentication.user_id, function(editors) {
                    
        			var pills = require('../sections').getPillNavOptions('new_section');
                    pills.unshift(
                    {
                        name: 'manage_topics',
                        title: '^loc_NEW_SECTION^',
                        icon: 'chevron-left',
                        href: '/admin/content/sections/section_map'
                    });
                    
                    var objects = {
                        navigation: pb.AdminNavigation.get(self.session, ['content', 'sections']),
                        pills: pills,
                        tabs: tabs,
                        parents: parents,
                        editors: editors
                    };
                    var angularData = pb.js.getAngularController(objects);
                    result = result.concat(angularData);
                
                    var content = self.localizationService.localize(['admin', 'sections'], result);
                    cb({content: content});
                });
            });
        });
    });
};

//exports
module.exports = NewSection;
