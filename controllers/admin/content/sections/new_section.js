/**
 * NewSection - Input for creating a new site section
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewSection(){}

//dependencies
var Sections = require('../sections');

//inheritance
util.inherits(NewSection, pb.BaseController);

NewSection.prototype.render = function(cb) {
	var self = this;
	
	this.setPageName(this.ls.get('NEW_SECTION'));
	this.ts.load('admin/content/sections/new_section', function(err, result) {
        
        var tabs = [
            {
                active: 'active',
                href: '#section_settings',
                icon: 'cog',
                title: self.ls.get('SETTINGS')
            },
            {
                href: '#section_seo',
                icon: 'tasks',
                title: self.ls.get('SEO')
            }
        ];
        
    	var dao = new pb.DAO();
    	dao.query('section', {parent: null}, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(parents) {                            
            
    		pb.users.getEditorSelectList(self.session.authentication.user_id, function(editors) {
                
    			var pills = Sections.getPillNavOptions('new_section');
                pills.unshift(
                {
                    name: 'manage_topics',
                    title: self.ls.get('NEW_SECTION'),
                    icon: 'chevron-left',
                    href: '/admin/content/sections/section_map'
                });
                
                var objects = {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'sections'], self.ls),
                    pills: pills,
                    tabs: tabs,
                    parents: parents,
                    editors: editors
                };
                var angularData = pb.js.getAngularController(objects);
                result          = result.concat(angularData);
                cb({content: result});
            });
        });
    });
};

//exports
module.exports = NewSection;
