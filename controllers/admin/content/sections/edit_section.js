/**
 * EditSection - Input for editing an existing site section
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditSection(){}

//dependencies
var AdminNavigation      = pb.AdminNavigation;
var SectionService       = pb.SectionService;
var NewSectionController = require('./new_section.js');

//inheritance
util.inherits(EditSection, NewSectionController);

//statics
var SUB_NAV_KEY = 'edit_section';

EditSection.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;
	
	//make sure an ID was passed
    if(!vars['id']) {
        this.reqHandler.serve404();
        return;
    }
    
    EditSection.super_.prototype.render.apply(self, [cb]);
};

EditSection.prototype.getPageName = function() {
	return this.ls.get('EDIT_NAVIGATION');
};

EditSection.prototype.getTemplate = function(cb) {
	var self = this;
	
	this.ts.registerLocal('section_id', this.pathVars.id);
	this.ts.registerLocal('content_type', '{{section.type}}');
	this.ts.registerLocal('selection_id_field', 'item');
	this.ts.registerLocal('content_search_value', function(flag, cb) {
    	if (self.navItem.item) {
    		var dao = new pb.DAO();
    		dao.loadById(self.navItem.item, self.navItem.type, function(err, content) {
    			cb(err, content ? content.headline : '');
    		});
    	}
    	else {
    		cb(null, '');
    	}
    });
	this.ts.load('admin/content/sections/edit_section', cb);
};

EditSection.prototype.getSubnavKey = function() {
    return SUB_NAV_KEY;   
}

EditSection.prototype.getDataTasks = function() {
	var self  = this;
	var tasks = EditSection.super_.prototype.getDataTasks.apply(self, []);
	tasks.section = function(callback) {
		if (self.session.fieldValues) {
			var navItem = self.session.fieldValues;
			if (util.isArray(navItem.keywords)) {
				navItem.keywords = navItem.keywords.join(',');
			}
			self.session.fieldValues = undefined;
            self.navItem = self.session.fieldValues;
			callback(null, navItem);
			return;
		}
		
		var dao = new pb.DAO();
	    dao.loadById(self.pathVars.id, 'section', function(err, navItem) {
	        if (navItem) {
                self.navItem = navItem;
	        	navItem.keywords = navItem.keywords.join(',');
	        }
	        callback(err, navItem);
	    });
	};
	return tasks;
};

EditSection.getSubNavItems = function(key, ls, data) {
	var pills = SectionService.getPillNavOptions();
    pills.unshift(
    {
        name: 'manage_topics',
        title: data.name,
        icon: 'chevron-left',
        href: '/admin/content/sections/section_map'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, EditSection.getSubNavItems);

//exports
module.exports = EditSection;
