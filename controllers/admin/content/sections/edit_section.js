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
	
	//make sure an ID was passed
    if(!this.query.id) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/sections/section_map'));
        return;
    }
    
    var dao = new pb.DAO();
    dao.loadById(this.query.id, 'section', function(err, section) {
        if(section == null) {
        	cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/sections/section_map'));
            return;
        }
        
        section.keywords = section.keywords.join(',');
        pb.templates.load('admin/content/sections/edit_section', '^loc_EDIT_SECTION^', null, function(data) {
            var result = data.split('^section_id^').join(section._id);
            var tabs   =
            [
                {
                    active: 'active',
                    href: '#section_settings',
                    icon: 'cog',
                    title: '^loc_SETTINGS^'
                },
                {
                    href: '#section_meta_data',
                    icon: 'tasks',
                    title: '^loc_META_DATA^'
                }
            ];
            
            self.displayErrorOrSuccess(result, function(newResult) {
                result = newResult;
                
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
                            editors: editors,
                            section: section
                        };
                        var angularData = pb.js.getAngularController(objects);
                        result = result.concat(angularData);
                    
                        var content = self.localizationService.localize(['admin', 'sections'], result);
                        cb({content: content});
                    });
                });
            });
        });
    });
};

//exports
module.exports = EditSection;
