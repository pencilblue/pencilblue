/**
 * EditSection - Input for editing an existing site section
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditSection(){}

//inheritance
util.inherits(EditSection, pb.BaseController);

EditSection.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;
	
	//make sure an ID was passed
    if(!vars['id']) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/sections/section_map'));
        return;
    }
    
    var dao = new pb.DAO();
    dao.loadById(vars['id'], 'section', function(err, section) {
        if(section == null) {
        	cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/sections/section_map'));
            return;
        }
        
        section.keywords = section.keywords.join(',');
        self.setPageName(self.ls.get('EDIT_SECTION'));
        self.ts.registerLocal('section_id', section._id);
        self.ts.load('admin/content/sections/edit_section', function(err, data) {
            var result = data;
            var tabs   =
            [
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
                
        	dao.query('section', {parent: null}, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(parents) {                            
                
        		pb.users.getEditorSelectList(self.session.authentication.user_id, function(editors) {
                    
        			var pills = require('../sections').getPillNavOptions('new_section');
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
                        editors: editors,
                        section: section
                    };
                    var angularData = pb.js.getAngularController(objects);
                    result          = result.split('^angular_script^').join(angularData);
                    cb({content: result});
                });
            });
        });
    });
};

//exports
module.exports = EditSection;
